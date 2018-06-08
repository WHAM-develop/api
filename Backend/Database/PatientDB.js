require('dotenv').config();
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const saltRounds = 10;
var jwt = require('jsonwebtoken');

class PatientDB {

    // Objects: 
    // Patient = Object(String Date Number Number String)
    // Patient-Session = Object(String Date Number Number String Number Date)
    // Session = Object(Number Date)
    // Message = Object(String String Date Boolean Number)

    constructor(connection, authorizer) {
        this.pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: "WHAM_TEST"
        });
        this.authorizer = authorizer;
    }

    // (Boolean -> Void) -> Void
    // Deletes all patients from the DB
    // If suceed, calls the callback with true
    // If fail, calls the callback with false (server error or other)
    delete_all_patient_info(callback) {
        var sql = "DELETE FROM PATIENT_SESSION";
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, results, fields) {
                if (error) {
                    connection.release();
                    callback(false);
                } else {
                    var sql = "DELETE FROM PATIENT_MESSAGE";
                    connection.query(sql, function (error, results, fields) {
                        if (error) {
                            connection.release();
                            callback(false);
                        } else {
                            var sql = "DELETE FROM PATIENT_THERAPIST";
                            connection.query(sql, function (error, results, fields) {
                                if (error) {
                                    connection.release();
                                    callback(false);
                                } else {
                                    var sql = "DELETE FROM PATIENT";
                                    connection.query(sql, function (error, results, fields) {
                                        if (error) {
                                            connection.release();
                                            callback(false);
                                        } else {
                                            connection.release();
                                            callback(true);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    // ([List-of Patient-Session] -> Void) -> Void
    // Calls the callback with every patients info and their last session
    get_all_patient_info(callback) {
        var sql =
            `SELECT username, dob, weight, height, information, 
        (SELECT score FROM PATIENT_SESSION PS WHERE P.username = PS.patientID ORDER BY time DESC LIMIT 1) as score,
        (SELECT time FROM PATIENT_SESSION PS WHERE P.username = PS.patientID ORDER BY time DESC LIMIT 1) as time
        FROM PATIENT P`;
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, results, fields) {
                if (error) {
                    connection.release();
                    callback([]);
                } else {
                    var toReturn = [];
                    for (var i = 0; i < results.length; i += 1) {
                        toReturn.push({
                            username: results[i].username,
                            dob: results[i].dob,
                            weigth: results[i].weight,
                            height: results[i].height,
                            information: results[i].information,
                            last_score: results[i].score,
                            last_activity_time: results[i].time
                        });
                    }
                    connection.release();
                    callback(toReturn);
                }
            });
        });
    }

    // String ([Maybe  //False if user does not exist
    //  Patient  // User Info
    //  [List-of Session]  //Session Info
    //  [List-of Message]]  //Message Info
    //  -> Void) 
    //  -> Void
    // Gives all information for the given patient
    get_patient_info(username, callback) {
        var inserts = [username];
        var info_query = "SELECT username, dob, weight, height, information FROM PATIENT P WHERE P.username = ?";
        info_query = mysql.format(info_query, inserts);

        var session_query = "SELECT score, time, sessionID FROM PATIENT_SESSION PS WHERE PS.patientID = ? ORDER BY time DESC";
        session_query = mysql.format(session_query, inserts);

        var message_query = "SELECT therapistID, message, date_sent, is_read FROM PATIENT_MESSAGE PM WHERE PM.patientID = ?";
        message_query = mysql.format(message_query, inserts);

        var requests_query = "SELECT therapistID FROM PATIENT_THERAPIST WHERE is_accepted = false AND patientID = ?";
        requests_query = mysql.format(requests_query, inserts);

        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false, false, false, false);
                throw err;
            }
            connection.query(info_query, function (error1, info_results, fields) {
                if (error1 || info_results.length == 0) {
                    connection.release();
                    callback(false, false, false, false);
                } else {
                    var user_info = {
                        username: info_results[0].username,
                        dob: info_results[0].dob,
                        weight: info_results[0].weight,
                        height: info_results[0].height,
                        information: info_results[0].information
                    };
                    connection.query(session_query, function (error2, session_results, fields) {
                        if (error2) {
                            connection.release();
                            callback(false, false, false, false);
                        } else {
                            var session_info = [];
                            for (var i = 0; i < session_results.length; i += 1) {
                                session_info.push({
                                    score: session_results[i].score,
                                    time: session_results[i].time,
                                    sessionID: session_results[i].sessionID
                                });
                            }
                            connection.query(message_query, function (error3, message_results, fields) {
                                if (error3) {
                                    connection.release();
                                    callback(false, false, false, false);
                                } else {
                                    var message_info = []
                                    for (var i = 0; i < message_results.length; i += 1) {
                                        message_info.push({
                                            therapistID: message_results[i].therapistID,
                                            message_content: message_results[i].message,
                                            date_sent: message_results[i].date_sent,
                                            is_read: message_results[i].is_read
                                        });
                                    }
                                    connection.query(requests_query, function (error4, requests_results, fields) {
                                        if (error4) {
                                            connection.release();
                                            callback(false, false, false, false);
                                        } else {
                                            var requests = [];
                                            for (var i = 0; i < requests_results.length; i += 1) {
                                                requests.push(requests_results[i].therapistID);
                                            }
                                            connection.release();
                                            callback(user_info, session_info, message_info, requests);
                                        }
                                    })
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    // String String String Number Number String (Boolean -> Void) -> Void
    // Tries to add the patient to the database
    // If suceed, calls the callback with true
    // If fail, calls the callback with false (user already exists or other)
    // Note: Weight in Kilo, Height in CM, DOB in YYYY-MM-DD
    add_patient(username, unencrypt_password, dob, weight, height, information, callback) {
        // Username, password, salt, DOB, Weight, Height, (?) Information
        var sql = "INSERT INTO PATIENT VALUES (?, ?, ?, ?, ?, ?, ?, 1)"
        var salt = bcrypt.genSaltSync(saltRounds);
        var password = bcrypt.hashSync(unencrypt_password, salt);

        var inserts = [username, password, salt, dob, weight, height, information];
        sql = mysql.format(sql, inserts);
        var authorizer = this.authorizer;
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, results, fields) {
                if (error) {
                    connection.release();
                    callback(false);
                } else {
                    authorizer.addUserRoles(username, username)
                    authorizer.allow(username, username, '*') // this user can do anything to themselves they want
                    var token = jwt.sign({
                        data: {
                            username: username,
                            password_hash: password,
                            type: "PATIENT"
                        }
                    }, process.env.JWT_SECRET, {
                        expiresIn: '10d'
                    });
                    connection.release();
                    callback(token);
                }
            });
        });
    }

    // String (Boolean -> Void) -> Void
    // Tries to purge the patient from the DB 
    // Including all session, message, and patient-therapist info
    // If suceed, gives true
    // If fail, gives false (unknown reason, probably server error)
    delete_patient(patientID, callback) {
        var inserts = [patientID];
        var sql = "DELETE FROM PATIENT_SESSION WHERE patientID = ?";
        sql = mysql.format(sql, inserts);
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, results) {
                if (error) {
                    connection.release();
                    callback(false);
                } else {
                    var sql = "DELETE FROM PATIENT_MESSAGE WHERE patientID = ?";
                    sql = mysql.format(sql, inserts);
                    connection.query(sql, function (error, results) {
                        if (error) {
                            connection.release();
                            callback(false);
                        } else {
                            var sql = "DELETE FROM PATIENT_THERAPIST WHERE patientID = ?";
                            sql = mysql.format(sql, inserts);
                            connection.query(sql, function (error, results) {
                                if (error) {
                                    connection.release();
                                    callback(false);
                                } else {
                                    var sql = "DELETE FROM PATIENT where username = ?";
                                    sql = mysql.format(sql, inserts);
                                    connection.query(sql, function (error, results) {
                                        if (error || results.affectedRows === 0) {
                                            connection.release();
                                            callback(false);
                                        } else {
                                            connection.release();
                                            callback(true);
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }

    // String ([Maybe [List-of Session]] -> Void) -> Void
    // Gives all the session info for a given patient
    get_patient_sessions(patientID, callback) {
        var inserts = [patientID];

        var session_query = "SELECT score, time, sessionID FROM PATIENT_SESSION PS WHERE PS.patientID = ? ORDER BY time DESC";
        session_query = mysql.format(session_query, inserts);
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(session_query, function (error2, session_results, fields) {
                if (error2) {
                    connection.release();
                    callback(false);
                } else {
                    var session_info = [];
                    for (var i = 0; i < session_results.length; i += 1) {
                        session_info.push({
                            score: session_results[i].score,
                            time: session_results[i].time,
                            sessionID: session_results[i].sessionID
                        });
                    }
                    connection.release();
                    callback(session_info);
                }
            });
        });
    }

    // String Number String (Boolean -> Void) -> Void
    // Adds an entry for a session to the DB
    // If suceed, gives true
    // If fail, gives false (server error or already added)
    add_patient_session(patientID, score, time, callback) {
        var sql = "INSERT INTO PATIENT_SESSION (patientID, score, time) VALUES (?, ?, ?)"
        var inserts = [patientID, score, time];

        sql = mysql.format(sql, inserts);
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    callback(true);
                }
            });
        });
    }

    // String String (Boolean -> Void) -> Void
    // Deletes a given patient session for the DB
    // If suceed, gives true
    // If fail, gives false (server error)
    delete_patient_session(patientID, sessionID, callback) {
        var sql = "DELETE FROM PATIENT_SESSION WHERE patientID = ? AND sessionID = ?";
        var inserts = [patientID, sessionID];

        sql = mysql.format(sql, inserts);
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error || result.affectedRows === 0) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    callback(true);
                }
            });
        });
    }

    // String String ([Number] -> Void) -> Void
    // Gives the score for the session at the given time/sessionID (accepts both)
    get_patient_session_specific(patientID, sessionID, callback) {
        var sql = "SELECT score, sessionID, time FROM PATIENT_SESSION WHERE patientID = ? AND (sessionID = ? or time = ?)"
        var inserts = [patientID, sessionID, sessionID];

        sql = mysql.format(sql, inserts);
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error || result.length == 0) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    callback({
                        activityLevel: result[0].score,
                        time: result[0].time,
                        id: result[0].sessionID
                    });
                }
            });
        });
    }

    // String String (Maybe-Error Maybe-User -> Void) -> Void
    // Calls the callback with true given a proper login
    // False given an incorrect login
    login(username, unencrypt_password, callback) {
        this.authorizer.patient_login(username, unencrypt_password, callback);
    }

    // String String String String (Boolean -> Void) -> Void
    // Adds a message to this patients database entry
    // Calls the callback with the sucess of the querry
    send_patient_a_message(patientID, therapistID, message, time, callback) {
        var sql = "INSERT INTO PATIENT_MESSAGE (patientID, therapistID, message, date_sent, is_read) VALUES (?, ?, ?, ?, false)";
        var inserts = [patientID, therapistID, message, time];
        sql = mysql.format(sql, inserts);
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, results, fields) {
                if (error) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    callback(true);
                }
            });
        });
    }

    // String
    //([Maybe [List-of Message]] -> Void)
    // -> Void
    // Gives every message that this patient has ever recieved
    get_all_messages_for(patientID, callback) {
        var sql = "SELECT therapistID, message, date_sent, is_read, messageID FROM PATIENT_MESSAGE WHERE patientID = ?";
        var inserts = [patientID];
        sql = mysql.format(sql, inserts);
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error) {
                    connection.release();
                    callback(false);
                } else {
                    var toSend = [];
                    for (var i = 0; i < result.length; i += 1) {
                        toSend.push({
                            therapistID: result[i].therapistID,
                            patientID: patientID,
                            message_content: result[i].message,
                            date_sent: result[i].date_sent,
                            is_read: result[i].is_read,
                            messageID: result[i].messageID
                        });
                    }
                    connection.release();
                    callback(toSend);
                }
            });
        });
    }

    // String Int (Boolean -> Void) -> Void
    // Marks the given message id as read
    // Gives back whether the querry suceeded or not
    mark_message_as_read(patientID, messageID, callback) {
        var sql = "UPDATE PATIENT_MESSAGE SET is_read = true WHERE patientID = ? AND messageID = ?";
        var inserts = [patientID, messageID];
        sql = mysql.format(sql, inserts);
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error || result.affectedRows === 0) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    callback(true);
                }
            });
        });
    }

    // String String (Maybe-Message -> Void) -> Void
    // Returns the info for a specific message
    get_specific_message(patientID, messageID, callback) {
        var sql = "SELECT therapistID, message, date_sent, is_read, messageID FROM PATIENT_MESSAGE WHERE patientID = ? AND messageID = ?";
        var inserts = [patientID, messageID];
        sql = mysql.format(sql, inserts);

        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error || result.length === 0) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    callback({
                        therapistID: result[0].therapistID,
                        patientID: patientID,
                        message_content: result[0].message,
                        date_sent: result[0].date_sent,
                        is_read: result[0].is_read,
                        messageID: result[0].messageID
                    });
                }
            });
        });
    }

    // String String Date (Boolean -> Void) -> Void
    // Pairs this therapist and patinet in the PATIENT_THERAPIST DB
    assign_to_therapist(patientID, therapistID, date_added, callback) {
        var sql = "INSERT INTO PATIENT_THERAPIST VALUES (?, ?, ?, null, false)";
        var inserts = [patientID, therapistID, date_added];
        sql = mysql.format(sql, inserts);
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    callback(true);
                }
            });
        });
    }
    
    // String String (Boolean -> Void) -> Void
    // Marks this patient-therapist join as accepted
    accept_therapist_request(patientID, therapistID, callback) {
        var sql = "UPDATE PATIENT_THERAPIST SET is_accepted = true WHERE patientID = ? AND therapistID = ?";
        var inserts = [patientID, therapistID];
        sql = mysql.format(sql, inserts);
        var authorizer = this.authorizer;
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error || result.affectedRows === 0) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    authorizer.allow(therapistID, patientID, '*') // this user can do anything to this patient they want
                    callback(true);
                }
            });
        });
    }

    // String String Date (Boolean -> Void) -> Void
    // Unpairs this therapist and patinet in the PATIENT_THERAPIST DB
    // DOES NOT delete this pair, simply marks its date_removed as the given date
    unassign_to_therapist(patientID, therapistID, date_removed, callback) {
        var sql = "UPDATE PATIENT_THERAPIST SET date_removed = ? WHERE patientID = ? AND therapistID = ?";
        var inserts = [date_removed, patientID, therapistID];
        sql = mysql.format(sql, inserts);
        var authorizer = this.authorizer
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error || result.affectedRows === 0) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    authorizer.removeAllow(therapistID, patientID, "*");
                    callback(true);
                }
            });
        });
    }

    // String (Boolean -> Void) -> Void
    // Deletes this message
    delete_message(patientID, messageID, callback) {
        var sql = "DELETE FROM PATIENT_MESSAGE WHERE patientID = ? AND messageID = ?";
        sql = mysql.format(sql, [patientID, messageID])
        this.pool.getConnection(function (err, connection) {
            if (err) {
                callback(false);
                throw err;
            }
            connection.query(sql, function (error, result, fields) {
                if (error || result.affectedRows === 0) {
                    connection.release();
                    callback(false);
                } else {
                    connection.release();
                    callback(true);
                }
            });
        });
    }

}

module.exports = PatientDB;