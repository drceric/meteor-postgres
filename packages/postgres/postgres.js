// PostgreSQL connection
pg = Npm.require('pg');
var conString = 'postgres://postgres:1234@localhost/postgres';

// TODO: reset command for development (in command line need a reset that does dropdb <name> and createdb <name>

Postgres = {};

/* objects: DataTypes, TableConstraints, QueryOperators, SelectOptions, and Joins */

Postgres._DataTypes = {
  $number: 'int',
  $string: 'varchar 255',
  $json: 'json',
  $datetime: 'timestamp',
  $float: 'float'
};

Postgres._TableConstraints = {
  $unique: 'unique',
  $check: 'check',
  $exclude: 'exclude',
  $notnull: 'not null'
};

Postgres._QueryOperators = {
  // TODO: not currently in use
  $eq: ' = ',
  $gt: ' > ',
  $lt: ' < '
};

Postgres._SelectOptions = {
  // TODO: not currently in use
  $gb: 'GROUP BY ',
  $lim: 'LIMIT ',
  $off: 'OFFSET '
};

Postgres._Joins = {
  $loj: ' LEFT OUTER JOIN ',
  $lij: ' LEFT INNER JOIN '
};

/* methods: createTable, createRelationship, alterTable, dropTable, insert, select, update, delete, autoSelect */

/**
 * TODO: user accounts, role management, authentication
 * @param {string} table
 * @param {object} tableObj
 * @param {string} tableObj key (field name)
 * @param {array} tableObj value (type and constraints)
 * @param {string} relTable
 */
// Postgres.createTable('students', { name: [$string, $notnull], age: [$number] }, 'major');
Postgres.createTable = function(table, tableObj, relTable) {
  // SQL: 'CREATE TABLE table (fieldName constraint);'
  // initialize input string parts
  var inputString = 'CREATE TABLE ' + table + '( id serial primary key not null';
  // iterate through array arguments to populate input string parts
  for (var key in tableObj) {
    inputString += ', ' + key + ' ';
    inputString += this._DataTypes[tableObj[key][0]] + ' ';
    for (var i = 1, count = tableObj[key].length - 1; i < count; i++) {
      inputString += tableObj[key][i] + ' ';
    }
  }
  // add foreign key
  if(relTable) {
    inputString += ' ' + relTable + '_id' + ' integer references' + relTable;
  }
  // add notify functionality and close input string
  inputString += ", created_at TIMESTAMPTZ default now()); " +
  "CREATE FUNCTION notify_trigger() RETURNS trigger AS $$ "+
  "DECLARE " +
  "BEGIN " +
  "PERFORM pg_notify('watchers', '{' || TG_TABLE_NAME || ':' || NEW.id || '}'); " +
  "RETURN new; " +
  "END; " +
  "$$ LANGUAGE plpgsql; " +
  "CREATE TRIGGER watched_table_trigger AFTER INSERT ON "+ table +
  " FOR EACH ROW EXECUTE PROCEDURE notify_trigger();";
  // send request to postgresql database
  console.log(inputString);
  pg.connect(conString, function(err, client) {
    console.log(err);
    client.query(inputString, function(error, results) {
      if (error) {
        console.log("error in create table " + table, error);
      } else {
        console.log("results in create table " + table, results);
      }
    });
    client.on('notification', function(msg) {
      console.log(msg.payload);
      var returnMsg = eval("(" + msg.payload + ")");
      console.log(returnMsg);
      console.log(typeof returnMsg);
      console.log(returnMsg.tasks);
      var k = '';
      var v = '';
      for (var key in returnMsg){
        k = key;
        v = returnMsg[key];
      }
      var selectString = "select * from " + k + " where id = " + v + ";";
      client.query(selectString, function(error, results) {
        if (error) {
          console.log("error in create table " + table, error);
        } else {
          console.log("results in create table ", results.rows);
        }
      });

    });
    var query = client.query("LISTEN watchers");
    console.log('hey', query);
  });
};

/**
 * TODO:
 * @param {string} table1
 * @param {string} table2
 */
Postgres.createRelationship = function(table1, table2) {
  // SQL: 'CREATE TABLE table1_table2(
  //    table1_id INT NOT NULL REFERENCES table1(id) on delete cascade,
  //    table2_id INT NOT NULL REFERENCES table2(id) on delete cascade,
  //    primary key(table1_id, table2_id) );'
  var table = table1 + '_' + table2;
  var inputString = 'CREATE TABLE ' + table + '(' +
      table1 + '_id int not null references ' + table1 + '(id) on delete cascade,' +
      table2 + '_id int not null references ' + table2 + '(id) on delete cascade,' + ');';
  // send request to postgresql database
  pg.connect(conString, function(err, client) {
    console.log(err);
    client.query(inputString, function(error, results) {
      if (error) {
        console.log("error in create relationship " + table, error);
      } else {
        console.log("results in create relationship " + table, results);
      }
    });
    client.on('notification', function(msg) {
      console.log(msg);
    });
    var query = client.query("LISTEN watchers");
  });
};

//* @param {object} tableObj
//* @param {string} tableObj key (field name)
//* @param {array} tableObj value (type and constraints)
// alterTable adds or updates fields in the table
// currently only going to allow add or drop column
// TODO: alter table
// updateObj $add or $drop column
Postgres.alterTable = function(table, updateObj) {
  // SQL: 'ALTER TABLE table ADD COLUMN fieldName dataType constraint;'
  // initialize input string parts
  var inputString = 'ALTER TABLE ' + table + ' ';
  // iterate through array arguments to populate input string parts
  for (var key in tableObj) {
    inputString += ', ' + key + ' ';
    inputString += this._DataTypes[tableObj[key][0]] + ' ';
    for (var i = 1, count = tableObj[key].length - 1; i < count; i++) {
      inputString += tableObj[key][i] + ' ';
    }
  }
};

Postgres.addColumn = function(table, tableObj) {
  var inputString = 'ALTER TABLE ' + table + ' ADD COLUMN ';
  // iterate through array arguments to populate input string parts
  for (var key in tableObj) {
    inputString += key + ' ';
    inputString += this._DataTypes[tableObj[key][0]] + ' ';
    for (var i = 1, count = tableObj[key].length - 1; i < count; i++) {
      inputString += tableObj[key][i] + ' ';
    }
  }
  inputString += ';';
  pg.connect(conString, function(err, client) {
    console.log(err);
    client.query(inputString, function(error, results) {
      if (error) {
        console.log("error in create relationship " + table, error);
      } else {
        console.log("results in create relationship " + table, results);
      }
    });
    client.on('notification', function(msg) {
      console.log(msg);
    });
    var query = client.query("LISTEN watchers");
  });
};

Postgres.dropColumn = function(table, column) {
  var inputString = 'ALTER TABLE ' + table + ' DROP COLUMN ' + column;
  inputString += ';';
  pg.connect(conString, function(err, client) {
    console.log(err);
    client.query(inputString, function(error, results) {
      if (error) {
        console.log("error in create relationship " + table, error);
      } else {
        console.log("results in create relationship " + table, results);
      }
    });
    client.on('notification', function(msg) {
      console.log(msg);
    });
    var query = client.query("LISTEN watchers");
  });
};

/**
 * TODO: Cascade or restrict?
 * @param {string} table
 */
Postgres.dropTable = function(table) {
  var inputString = 'DROP TABLE IF EXISTS ' + table + ';';
  // send request to postgresql database
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, function(error, results) {
      if (error) {
        console.log("error in drop " + table, error);
      } else {
        console.log("results in drop " + table, results);
      }
      done();
    });
  });
};

/**
 * TODO: foreign key associations
 * @param {string} table
 * @param {object} insertObj
 * @param {string} insertObj key (field name)
 * @param {string} insertObj value (value)
 */
Postgres.insert = function(table, insertObj) {
  // SQL: 'INSERT INTO table (insertFields) VALUES (insertValues);'
  // initialize input string parts
  var inputString = 'INSERT INTO ' + table + ' (';
  var valueString = ') VALUES (';
  var keys = Object.keys(insertObj);
  var insertArray = [];
  // iterate through array arguments to populate input string parts
  for (var i = 0, count = keys.length - 1; i < count; ) {
    inputString += keys[i] + ', ';
    valueString += '$' + (++i) + ', ';
    insertArray.push(insertObj[keys[i]]);
  }
  // combine parts and close input string
  inputString += keys[keys.length-1] + valueString + '$' + keys.length + ');';
  insertArray.push(insertObj[keys[keys.length-1]]);
  // send request to postgresql database
  console.log('inputString', inputString);
  console.log('insertArray', insertArray);
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, insertArray, function(error, results) {
      if (error) {
        console.log("error in insert " + table, error);
      } else {
        console.log("results in insert " + table, results);
      }
      done();
    });
  });
};




/**
 * TODO: Add right joins?, OR to selectObj, should work for all but tableObj to by empty
 * @param {object} tableObj
 * @param {string} tableObj key (table name)
 * @param {string} tableObj value (field name)
 * @param {object} selectObj
 * @param {string} selectObj key (field name)
 * @param {object} selectObj.fieldName key (operator)
 * @param {object} selectObj.fieldName value (comparator)
 * @param {object} optionsObj
 * @param {string} optionsObj key (option)
 * @param {number} optionsObj value (comparator)
 */
// Postgres.select(testScores); --> return ALL
// Postgres.select(testScores, { score: { $gt: '70' } }); --> return all data for students with score of 70 or above
// Postgres.select({ testScores: 'student' }, { score: { $gt: '70' } }); --> return student names with score of 70+
// Postgres.select({ testScores: 'student' }, { score: { $gt: '70' } }, { $gb: 'classTime' }); --> return student names with score of 70+ grouped by classTime
// SQL: SELECT fields FROM table1 JOIN table2 ON table1.id = table2.id WHERE ... --when they are connected via helper table
// Postgres.select({ testScores: 'student' }, { score: { $gt: '70' } }, { $gb: 'classTime' }, { $roj: 'class' }); --> ids from both tables used for join
// SQL: SELECT fields FROM table1 JOIN table2 ON table1.id = table2.id WHERE ... --when they are connected via foreign key in first table
// Postgres.select({ testScores: 'student' }, { score: { $gt: '70' } }, { $gb: 'classTime' }, { $loj: 'class',  }); // $loj, $lij
Postgres.select = function(tableObj, selectObj, optionsObj, joinObj) {
  // SQL: 'SELECT fields FROM table WHERE field operator comparator AND (more WHERE) GROUP BY field / LIMIT number / OFFSET number;'

  // tableObj
  // contains the table name as key and the fields as a string
  // for all fields user can pass in the table name as a string (need to insert * into the inputString)
  var table, returnFields;
  if (typeof tableObj === 'string') {
    table = tableObj;
    returnFields = ' * ';
  } else if (Object.keys(tableObj).length === 1) {
    table = Object.keys(tableObj)[0];
    returnFields = tableObj[table];
  }

  // selectObj
  // contains the field as a key then another obj as the value with the operator and conditional values
  var selectString = '';
  if (Object.keys(selectObj).length === 0) {
    var selectField, operator, comparator;
    selectField = Object.keys(selectObj)[0];
    operator = Object.keys(selectObj[selectField])[0];
    comparator = selectObj[selectField][operator];
    selectString += 'WHERE ' + selectField + ' ' + operator + ' ' + comparator;
  }

  var options = {
    $gb: 'GROUP BY ',
    $lim: 'LIMIT ',
    $off: 'OFFSET '
  };
  // optionsObj
  // object that can contain keys from SelectOptions and values of strings or integers or floats
  var optionString = '';
  if (Object.keys(optionsObj).length === 0) {
    for (var key in optionsObj) {
      optionString += ' ' + options[key] + ' ' + optionsObj[key];
    }
  }

  // joinObj
  // object contains keys from join and values of table names
  //JOIN table2 ON table1.id = table2.id --> { $roj: 'class' }
  // foreign key will always be foreignTable_id because of code in createTable
  // foreign key:
  // SELECT * FROM table1 LEFT OUTER JOIN table2 ON table1(foreign_id) = table2(id)
  var joinString = '';
  var joinTable, joinType;
  if (Object.keys(joinObj).length === 0) {
    joinType = Object.keys(joinObj)[0]; // '$loj'
    joinTable = tableObj[joinType]; // 'class'
    joinString = Postgres._Joins(joinType); // ' LEFT OUTER JOIN class ON students.class_id = class(id);
    joinString += joinTable + ' ON '+ table + '.' + joinTable + '_id = ' + joinTable + '(id)' + ';';
  }


  var inputString = 'SELECT ' + returnFields + ' FROM ' + table + joinString + ' ' + selectString + ' ' + optionString + ';';
  console.log(inputString);
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, function(error, results) {
      if (error) {
        console.log("error in select " + table, error);
      } else {
        console.log("results in select " + table, results.rows);
      }
      done();
    });
  });
};

/**
 * TODO: OR to selectObj
 * @param {object} tableObj
 * @param {string} tableObj key (table name)
 * @param {string} tableObj value (field name) -> to update
 * @param {object} selectObj
 * @param {string} selectObj key (field name)
 * @param {object} selectObj.fieldName key (operator)
 * @param {object} selectObj.fieldName value (comparator) -> filters
 * @param {object} updateObj
 * @param {string} updateObj key (field name)
 * @param {number} updateObj value (updated data) -> updates
 */
Postgres.update = function(tableObj, updateObj, selectObj) {
  // SQL: 'SELECT fields FROM table WHERE field operator comparator AND (more WHERE) GROUP BY field / LIMIT number / OFFSET number;'

  // tableObj
  // contains the table name as key and the fields as a string
  // for all fields user can pass in the table name as a string (need to insert * into the inputString)
  var table, toUpdateFields;
  table = Object.keys(tableObj)[0];
  toUpdateFields = tableObj[table];

  // selectObj
  // contains the field as a key then another obj as the value with the operator and conditional values
  var selectString = '';
  if (selectObj) {
    var selectField, operator, comparator;
    selectField = Object.keys(selectObj)[0];
    operator = Object.keys(selectObj[selectField])[0];
    comparator = selectObj[selectField][operator];
    selectString += 'WHERE ' + selectField + ' ' + operator + ' ' + comparator;
  }

  var updateString = '';
  for (var key in updateObj) {
    updateString += ' ' + options[key] + ' ' + optionsObj[key];
  }

  var inputString = 'UPDATE ' + table + ' SET ' + updateString + ' ' + selectString + ';';
  console.log(inputString);
  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, function(error, results) {
      if (error) {
        console.log("error in update " + table, error);
      } else {
        console.log("results in update " + table, results.rows);
      }
      done();
    });
  });
};

/**
 * TODO: Additional where parameters
 * @param table
 * @param selectObj
 */
Postgres.delete = function (table, selectObj) {
  // SQL: 'DELETE FROM table * WHERE field operator comparator;'
  var inputString = 'DELETE FROM ' + table;

  var selectString = '';
  if (selectObj) {
    var selectField, operator, comparator;
    selectField = Object.keys(selectObj)[0];
    operator = Object.keys(selectObj[selectField])[0];
    comparator = selectObj[selectField][operator];
    selectString += 'WHERE ' + selectField + ' ' + operator + ' ' + comparator;
  }

  inputString += selectString + ';';

  pg.connect(conString, function(err, client, done) {
    console.log(err);
    client.query(inputString, function(error, results) {
      if (error) {
      console.log("error in delete " + table, error);
      } else {
        console.log("results in delete " + table, results.rows);
      }
      done();
    });
  });
};

Postgres.autoSelect = function (sub) {
  pg.connect(conString, function(err, client) {
    var query = client.query("LISTEN watchers");
    client.on('notification', function(msg) {
      console.log(msg.payload);
      var returnMsg = eval("(" + msg.payload + ")");
      console.log("IN autoSelect");
      console.log(returnMsg);
      console.log(typeof returnMsg);
      console.log(returnMsg.tasks);
      var k = '';
      var v = '';
      for (var key in returnMsg) {
        k = key;
        v = returnMsg[key];
      }
      var selectString = "select * from " + k + " where id = " + v + ";";
      client.query(selectString, function(error, results) {
        if (error) {
          console.log("error in auto select " + table, error);
        } else {
          console.log(this);
          console.log("results in auto select ", results.rows);
          console.log(results.rows);
          sub._session.send({
            msg: 'added',
            collection: sub._name,
            id: sub._subscriptionId,
            fields: {
              reset: false,
              tableId: results.rows[0].id,
              text: results.rows[0].text,
              createdAt: results.rows[0].created_at
            }
          });
          return results.rows;
        }
      });
    });
  });
};

Postgres.getCursor = function(){
  var cursor = {};
  //Creating publish
  cursor._publishCursor = function(sub){
    this.autoSelect(sub);
  };
  cursor.autoSelect = this.autoSelect;
  return cursor;
};
