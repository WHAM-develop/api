//Returns the info for a single patient
// Request Response PatientDB -> Void
exports.getPatient = function (req, res, patientDB, authorizer, responder) {
    authorizer.verifyJWT(req, function (verified) {
        if (!verified) {
            responder.report_bad_token(req, res);
            return;
        }
        var id = req.params.patientID
        authorizer.isAllowed(verified, id, '*', function (err, can_view) {
            if (can_view) {
                patientDB.get_patient_info(id, function (info, sessions, messages, requests) {
                    if (info === false) {
                        responder.report_not_found(req, res);
                    } else {
                        var realSessions = [];
                        for (var i = 0; i < sessions.length; i += 1) {
                            realSessions.push([sessions[i].time, sessions[i].score]);
                        }
                        responder.report_sucess(req, res, {
                            info: info,
                            sessions: sessions,
                            messages: messages,
                            requests: requests
                        }, 'patient/patient-detail', {
                            info: info,
                            sessions: realSessions,
                            messages: messages,
                            requests: requests
                        })
                    }
                });
            } else {
                responder.report_not_authorized(req, res);
            }
        });
    });
}

//Deletes this patient from the database
// Request Response PatientDB -> Void
exports.deletePatient = function (req, res, patientDB, authorizer, responder) {
    authorizer.verifyJWT(req, function (verified) {
        if (!verified) {
            responder.report_bad_token(req, res);
            return;
        }
        authorizer.isAllowed(verified, req.params.patientID, '*', function (err, can_view) {
            if (can_view) {
                patientDB.delete_patient(req.params.patientID, function (worked) {
                    if (worked === false) {
                        responder.report_not_found(req, res);
                    } else {
                        responder.report_sucess_no_info(req, res);
                    }
                });
            } else {
                responder.report_not_authorized(req, res);
            }
        });
    });
}