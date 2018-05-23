const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;

class AuthenticationDB {

    constructor(db_object) {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: "WHAM_TEST"
        });
        console.log("created");
    }

    // String String (Maybe-String -> Void) -> Void
    // Logs this patient in
    // If sucess, gives the salt
    patient_login(username, unencrypt_password, callback) {
        this.general_login("PATIENT", username, unencrypt_password, callback);
    }

    // String String (Maybe-String -> Void) -> Void
    // Logs this therapist in
    // If sucess, gives the salt
    therapist_login(username, unencrypt_password, callback) {
        this.general_login("THERAPIST", username, unencrypt_password, callback);
    }

    // String String String (Maybe-String -> Void) -> Void
    general_login(table_name, username, unencrypt_password, callback) {
        var get_salt_sql = "SELECT salt FROM " + table_name + " T WHERE T.username = ?";
        var get_salt_insert = [username];
        get_salt_sql = mysql.format(get_salt_sql, get_salt_insert);
        this.pool.getConnection(function (err, connection) {
            if(err) { callback(false); }
            connection.query(get_salt_sql, function (error, results, fields) {
                if (error || results.length == 0) {
                    callback(false);
                } else {
                    var salt = results[0].salt;
                    var password = bcrypt.hashSync(unencrypt_password, salt);
                    var login_sql = "SELECT username FROM " + table_name + " T where T.username = ? AND T.password = ?";
                    var login_insert = [username, password];
                    login_sql = mysql.format(login_sql, login_insert);
                    connection.query(login_sql, function (error, results, fields) {
                        if (error || results.length == 0) {
                            callback(false);
                            connection.release();
                        } else {
                            callback(salt);
                            connection.release();
                        }
                    });
                }
            });
        });
    }

}

module.exports = AuthenticationDB;