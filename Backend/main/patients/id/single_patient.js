//Returns the info for a single patient
// Request Response PatientDB -> Void
exports.getPatient = function (req, res) {
    req.patientDB.get_patient_info(req.params.patientID).then(([info, sessions, messages, requests]) => {
            var realSessions = [];
            for (var i = 0; i < sessions.length; i += 1) {
                realSessions.push([sessions[i].time, sessions[i].score]);
            }
            req.responder.report_sucess(req, res, {
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
    }).catch(error => {
        req.responder.report_not_found(req, res);
    })
}

//Deletes this patient from the database
// Request Response PatientDB -> Void
exports.deletePatient = function (req, res) {
    req.patientDB.delete_patient(req.params.patientID).then(() => {
        req.responder.report_sucess_no_info(req, res);
    }).catch(error => {
        req.responder.report_not_found(req, res);
    });
}
