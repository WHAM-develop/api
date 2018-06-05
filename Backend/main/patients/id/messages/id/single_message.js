// Marks the given message as read
// Request Response PatientDB -> Void
exports.markMessageAsRead = function (req, res, patientDB, authorizer) {
    authorizer.verifyJWT(req, function (verified) {
        if (!verified) {
            res.writeHead(403, {
                "Content-Type": "application/json"
            });
            res.end();
            return;
        }
        var patientID = req.params.patientID;
        var messageID = req.params.messageID;
        authorizer.isAllowed(verified, patientID, '*', function (err, can_view) {
            if (can_view) {
                patientDB.mark_message_as_read(patientID, messageID, function (worked) {
                    if (worked) {
                        res.writeHead(204, {
                            "Content-Type": "application/json"
                        });
                        res.end();
                    } else {
                        res.writeHead(403, {
                            "Content-Type": "application/json"
                        });
                        res.end();
                    }
                });
            } else {
                authorizer.report_not_authorized(req, res);
            }
        });
    });
}

// Returns info about the given message
// Request Response PatientDB -> Void
exports.getMessage = function (req, res, patientDB, authorizer) {
    authorizer.verifyJWT(req, function (verified) {
        if (!verified) {
            res.redirect(req.baseUrl + '/login');
            return;
        }
        var patientID = req.params.patientID;
        var messageID = req.params.messageID;
        authorizer.isAllowed(verified, patientID, '*', function (err, can_view) {
            if (can_view) {
                patientDB.get_specific_message(patientID, messageID, function (message_content) {
                    if (req.headers['accept'].includes('text/html')) {
                        res.render('patient/patient-message-detail', message_content);
                    } else if (req.headers['accept'].includes('application/json')) {
                        if (message_content === false) {
                            res.writeHead(403, {
                                "Content-Type": "application/json"
                            });
                            res.end();
                        } else {
                            res.writeHead(200, {
                                "Content-Type": "application/json"
                            });
                            res.end(JSON.stringify(message_content));
                        }
                    }
                });
            } else {
                authorizer.report_not_authorized(req, res);
            }
        });
    });
}

// Totally deletes the given message
// Request Response PatientDB -> Void
exports.deletePatientMessage = function (req, res, patientDB, authorizer) {
    authorizer.verifyJWT(req, function (verified) {
        if (!verified) {
            res.redirect(req.baseUrl + '/login');
            return;
        }
        var patientID = req.params.patientID;
        var messageID = req.params.messageID;
        authorizer.isAllowed(verified, patientID, '*', function (err, can_view) {
            if (can_view) {
                patientDB.delete_message(patientID, messageID, function (worked) {
                    if (worked) {
                        res.writeHead(204, {
                            "Content-Type": "application/json"
                        });
                        res.end();
                    } else {
                        res.writeHead(403, {
                            "Content-Type": "application/json"
                        });
                        res.end();
                    }
                })
            } else {
                res.writeHead(403, {
                    "Content-Type": "application/json"
                });
                res.end();
            }
        });
    });
}