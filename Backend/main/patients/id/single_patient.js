//Returns the info for a single patient
// Request Response PatientDB -> Void
exports.getPatient = function (req, res, patientDB, authorizer) {
    authorizer.verifyJWT(req.query.auth_token, function (verified) {
        if (!verified) {
            res.writeHead(403, {
                "Content-Type": "application/json"
            });
            res.end();
            return;
        }
        var id = req.params.patientID
        authorizer.isAllowed(verified, id, '*', function (err, can_view) {
            if (can_view) {
                patientDB.get_patient_info(id, function (info, sessions, messages) {
                    if (req.headers['accept'].includes('text/html')) {
                        res.render('patient-detail', {
                            info: info,
                            sessions: sessions,
                            messages: messages
                        });
                    } else if (req.headers['accept'].includes('application/json')) {
                        if (info === false) {
                            res.writeHead(403, {
                                "Content-Type": "application/json"
                            });
                            res.end(JSON.stringify({
                                error: "User does not exist"
                            }));
                        } else {
                            res.writeHead(200, {
                                "Content-Type": "application/json"
                            });
                            res.end(JSON.stringify({
                                info: info,
                                sessions: sessions,
                                messages: messages
                            }));
                        }
                        //Send patient info as JSON
                    }
                });
            } else {
                res.writeHead(403);
                res.end();
            }
        });
    });
}

//Deletes this patient from the database
// Request Response PatientDB -> Void
exports.deletePatient = function (req, res, patientDB, authorizer) {
    authorizer.verifyJWT(req.query.auth_token, function (verified) {
        if (!verified) {
            res.writeHead(403, {
                "Content-Type": "application/json"
            });
            res.end();
            return;
        }
        authorizer.isAllowed(verified, req.params.patientID, '*', function (err, can_view) {
            if (can_view) {
                patientDB.delete_patient(req.params.patientID, function (worked) {
                    if (worked === false) {
                        res.writeHead(403, {
                            "Content-Type": "application/json"
                        });
                        res.end();
                    } else {
                        res.writeHead(204, {
                            "Content-Type": "application/json"
                        });
                        res.end();
                    }
                });
            } else {
                res.writeHead(403, {
                    "Content-Type": "application/json"
                });
                res.end();
            }
        });
    });
}