'use strict';

const
    fs = require('fs'),
    path = require('path'),

    abLog = require('ab-log')
;


let createClassesAsync = async (packagesPaths, table) => {
    let packagePath = findPackage(packagesPaths, table);
    if (packagePath === null) {
        abLog.warn(`Cannot find tables '${table.fullName}' package. Skipping.`);
        return;
    }

    createClass(packagePath, table);
};
module.exports = createClassesAsync;


let createClass = (packagePath, table) => {
    let content = '';
    content += 
`<?php namespace EC\\${table.packageName};
defined('_ESPADA') or die(NO_ACCESS);

use E, EC,
    EC\\Database;

class _T${table.name} extends Database\\TTable
{

    public function __construct(EC\\MDatabase $db, $tablePrefix)
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
    }

}
`
    ;

    fs.writeFileSync(path.join(packagePath, `classes`, `_T${table.name}.php`), content);
    abLog.success(`Saved: ${table.fullName}.`);
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
    let match = /^(.+?)(\((.+?)\))?$/.exec(field.type);
    let notNull = field.notNull;

    if (match[1] === 'tinyint' && match[3] === '1')
        return `Bool(${notNull})`;
    else if (match[1] === 'date')
        return `Date(${notNull})`;
    else if (match[1] === 'datetime')
        return `DateTime(${notNull})`;
    else if (match[1] === 'number')
        return `Float(${notNull})`;
    else if (match[1] === 'int')
        return `Int(${notNull})`;
    else if(match[1] === 'tinytext')
        return `Text(${notNull}, 'tiny')`;
    else if(match[1] === 'text')
        return `Text(${notNull}, 'regular')`;
    else if(match[1] === 'mediumtext')
        return `Text(${notNull}, 'medium')`;
    else if(match[1] === 'varchar')
        return `Varchar(${notNull}, ${match[3]})`;

    abLog.warn(`Unknown field:`, field);
    throw new Error('Unknown field');
};