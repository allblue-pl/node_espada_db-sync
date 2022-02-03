'use strict';

const
    fs = require('fs'),

    abLog = require('ab-log'),
    abMysql = require('ab-mysql'),

    js0 = require('js0')
;

const
    getTables_Async = require('./getTables_Async'),
    createClasses_Async = require('./createClasses_Async')
;


async function exec_Async(info)
{
    js0.args(arguments, js0.Preset({
        esite: js0.Preset({
            path: 'string',
        }),

        connection: js0.Preset({
            host: 'string',
            user: 'string',
            password: 'string',
            database: 'string',
        }),

        tables: js0.Preset({
            list: [ Array, js0.Default([]) ],
            listOnly: [ 'boolean', js0.Default(false) ],
            ignore: [ Array, js0.Default([]) ],
        }),
    }));

    return (async () => {
        let db = abMysql.connect(info.connection);
    
        // let db = abMysql.connect({
        //     host: 'localhost',
        //     user: 'root',
        //     password: '',
        //     database: 'stacja-klasyki'
        // });
    
        let packageDirs = fs.readdirSync(`${info.esite.path}/packages`).filter((file) => {
            return fs.statSync(`${info.esite.path}/packages/${file}`).isDirectory();
        });
        for (let i = 0; i < packageDirs.length; i++)
            packageDirs[i] = `${info.esite.path}/packages/${packageDirs[i]}`;

        let tables = await getTables_Async(db, info);
        for (let table of tables) {
            await createClasses_Async(packageDirs, table);
        }
    
        db.disconnect();
            })()
        .catch((err) => {
            abLog.error(err);
            process.exit(1);
        });
}
module.exports.exec_Async = exec_Async;