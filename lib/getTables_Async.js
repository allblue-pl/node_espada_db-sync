'use strict';


let getTables_Async = async (db, info) => {
    let results = null;

    let tableNames_Ignore = [];
    for (let tableName of info.tables.ignore)
        tableNames_Ignore.push(tableName.toLowerCase());
    let tableNames_List = [];
    for (let tableName of info.tables.list)
        tableNames_List.push(tableName.toLowerCase());
    let tableNames_ListOnly = info.tables.listOnly;

    let tables = [];
    results = await db.query_Select_Async('SHOW TABLES;');
    for (let row of results) {
        let tableName = row[Object.keys(row)[0]];

        if (tableNames_ListOnly) {
            if (!tableNames_List.includes(tableName.toLowerCase()))
                continue;
        } else {
            if (tableNames_Ignore.includes(tableName.toLowerCase()))
                continue;
        }

        let tableName_Arr = tableName.split('_');

        tables.push({
            packageName: tableName_Arr[0],
            fullName: tableName,
            name: tableName_Arr.slice(1).join('_'),
            className: tableName_Arr.slice(1).join('_').replace(/\-/g, '_'),
            pks: [],
        });
    }

    for (let tableName of info.tables.list) {
        let found = false;
        for (let table of tables) {
            if (table.fullName.toLowerCase() === tableName.toLowerCase()) {
                found = true;
                break;
            }
        }

        if (!found)
            throw new Error(`Table '${tableName}' from list not found.`);
    }

    for (let table of tables) {
        results = await db.query_Select_Async(`DESC \`${table.fullName}\`;`);
        let fields = [];
        for (let row of results) {
            fields.push({
                name: row.Field,
                type: row.Type,
                key: row.Key,
                notNull: row.Null === 'NO',
            });
        }
        let pks = [];
        for (let field of fields) {
            if (field.key === 'PRI')
                pks.push(field.name);
        }
        table.fields = fields;
        table.pks = pks;
    }

    return tables;
};
module.exports = getTables_Async;