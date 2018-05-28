//Returns the info for a single patient session
// Request Response PatientDB -> Void
exports.getSession = function(req, res, patientDB) {
    var patientID = req.params.patientID;
    var sessionID = req.params.sessionID;
    patientDB.get_patient_session_specific(patientID, sessionID, function (sessionInfo) {
        if (req.headers['accept'].includes('text/html')) {
            res.send("Getting this session");
        } else if (req.headers['accept'].includes('application/json')) {
            if (sessionInfo === false) {
                res.writeHead(403, {
                    "Content-Type": "application/json"
                });
                res.end();
            } else {
                res.writeHead(200, {
                    "Content-Type": "application/json"
                });
                res.end(JSON.stringify(sessionInfo));
            }
        } else {
            //An unsupported request
        }
    })
}

//Deletes this patient session from the database
// Request Response PatientDB -> Void
exports.deletePatientSession = function(req, res, patientDB) {
    var patientID = req.params.patientID;
    var sessionID = req.params.sessionID;
    patientDB.delete_patient_session(patientID, sessionID, function (worked) {
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
}