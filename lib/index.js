'use strict';

const
    abLog = require('ab-log'),
    abMysql = require('ab-mysql'),

    js0 = require('js0')
;

const
    getTables = require('./getTablesAsync'),
    createClasses = require('./createClassesAsync')
;


async function execAsync(connectionInfo)
{
    js0.args(arguments, js0.Preset({
        host: 'string',
        user: 'string',
        password: 'string',
        database: 'string'
    }));

    (async () => {
        let db = abMysql.connect(connectionInfo);
    
        // let db = abMysql.connect({
        //     host: 'localhost',
        //     user: 'root',
        //     password: '',
        //     database: 'stacja-klasyki'
        // });
    
        let tables = await getTables(db);
        for (let table of tables) {
            await createClasses([ '../esite/packages/ecore', '../esite/packages/site' ], 
                    table);
        }
    
        db.disconnect();
            })()
        .catch((err) => {
            abLog.error(err);
            process.exit(1);
        });
}
module.exports.execAsync = execAsync;