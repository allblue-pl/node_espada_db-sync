'use strict';

const
    fs = require('fs'),
    path = require('path'),

    abLog = require('ab-log')
;


let createClasses_Async = async (packagesPaths, table) => {
    let packagePath = findPackage(packagesPaths, table);
    if (packagePath === null) {
        abLog.warn(`Cannot find tables '${table.fullName}' package. Skipping.`);
        return;
    }

    createClass(packagePath, table);
    createClass_Child(packagePath, table);
};
module.exports = createClasses_Async;


let createClass = (packagePath, table) => {
    let pkStrs_Arr = [];
    for (let pk of table.pks)
        pkStrs_Arr.push(`'${pk}'`);

    let content = '';
    content += 
`<?php namespace EC\\${table.packageName};
defined('_ESPADA') or die(NO_ACCESS);

use E, EC,
    EC\\Database;

class _T${table.className} extends Database\\TTable
{

    public function __construct(EC\\MDatabase $db, $tablePrefix = 't')
    {
        parent::__construct($db, '${table.fullName}', $tablePrefix);

        $this->setColumns([`
    ;

    let fieldDeclarations_Arr = [];
    for (let field of table.fields) {
        content += `
            ` + getFieldDeclaration(field);
        ;
    }

    content += `
        ]);
        $this->setPKs([ ` + pkStrs_Arr.join(',') + ` ]);
    }

}
`
    ;

    fs.writeFileSync(path.join(packagePath, `classes`, `_T${table.className}.php`), content);
    abLog.success(`Saved: ${table.fullName}.`);
};


let createClass_Child = (packagePath, table) => {
    let childClassPath = path.join(packagePath, `classes`, `T${table.className}.php`);
    if (fs.existsSync(childClassPath))
        return;

    let tablePrefix = '';
    for (let i = 0; i < table.packageName.length; i++) {
        if (table.packageName[i] === table.packageName[i].toUpperCase())
            tablePrefix += table.packageName[i].toLowerCase();
    }
    tablePrefix += '_';
    for (let i = 0; i < table.name.length; i++) {
        if (table.name[i] === table.name[i].toUpperCase())
            tablePrefix += table.name[i].toLowerCase();
    }

    tablePrefix = tablePrefix.replace(/\-/g, '');

    let content = '';
    content += 
`<?php namespace EC\\${table.packageName};
defined('_ESPADA') or die(NO_ACCESS);

use E, EC,
    EC\\Database;

class T${table.className} extends _T${table.className}
{

    public function __construct(EC\\MDatabase $db)
    {
        parent::__construct($db, '${tablePrefix}');
    }

}
`
    ;

    fs.writeFileSync(childClassPath, content);
    abLog.success(`Created child for: ${table.fullName}.`);
};


let findPackage = (packagesPaths, table) => {
    for (let packagesPath of packagesPaths) {
        let dirs = fs.readdirSync(packagesPath);
        for (let dir of dirs) {
            if (dir === table.packageName)
                return path.join(packagesPath, dir);
        }
    }

    return null;
};

let getFieldDeclaration = (field) => {
    return `'${field.name}' => new Database\\F` + getFieldType(field) + `,`;
};

let getFieldType = (field) => {
    let match = /^(.+?)(\((.+?)\)( .+)?)?$/.exec(field.type);
    let notNull = field.notNull;
    
    if (match[1] === 'tinyint' && match[3] === '1')
        return `Bool(${notNull})`;
    else if (match[1] === 'bigint')
        return `Long(${notNull})`;
    else if(match[1] === 'blob')
        return `Blob(${notNull}, 'regular')`;
    else if (match[1] === 'date')
        return `Date(${notNull})`;
    else if (match[1] === 'datetime')
        return `DateTime(${notNull})`;
    else if(match[1] === 'enum')
        return `String(${notNull}, 16)`;
    else if (match[1] === 'float')
        return `Float(${notNull})`;
    else if (match[1] === 'number')
        return `Float(${notNull})`;
    else if (match[1] === 'int')
        return `Int(${notNull})`;
    else if (match[1] === 'int unsigned')
        return `Int(${notNull})`;
    else if(match[1] === 'tinyblob')
        return `Blob(${notNull}, 'tiny')`;
    else if(match[1] === 'tinytext')
        return `Text(${notNull}, 'tiny')`;
    else if(match[1] === 'text')
        return `Text(${notNull}, 'regular')`;
    else if(match[1] === 'mediumtext')
        return `Text(${notNull}, 'medium')`;
    else if(match[1] === 'mediumblob')
        return `Blob(${notNull}, 'medium')`;
    else if(match[1] === 'varchar')
        return `String(${notNull}, ${match[3]})`;

    abLog.warn(`Unknown field:`, field);
    throw new Error('Unknown field');
};