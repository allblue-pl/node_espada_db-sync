'use strict';


let getTablesAsync = async (db) => {
    let results = null;

    let tables = [];
    results = await db.query_Select('SHOW TABLES;');
    for (let row of results) {
        let tableName = row[Object.keys(row)[0]];
        let tableName_Arr = tableName.split('_');

        tables.push({
            packageName: tableName_Arr[0],
            fullName: tableName,
            name: tableName_Arr.slice(1).join('_'),
            className: tableName_Arr.slice(1).join('_').replace(/\-/g, '_'),
        });
    }

    for (let table of tables) {
        results = await db.query_Select(`DESC \`${table.fullName}\`;`);
        let fields = [];
        for (let row of results) {
            fields.push({
                name: row.Field,
                type: row.Type,
                key: row.Key,
                notNull: row.Null === 'NO',
            });
        }
        table.fields = fields;
    }

    return tables;
};
module.exports = getTablesAsync;