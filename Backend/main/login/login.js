// Request Response PatientDB TherapistDB -> Void
// Tests the login given by the patient or therapist
// Will send the auth token for this user when done
exports.login =  function(req, res, patientDB, therapistDB) {
    patientDB.login(req.body.username, req.body.password, function (sucess) {
        if (sucess) {
            res.writeHead(200, {
                "Content-Type": "application/json"
            });
            res.end(JSON.stringify({
                token: sucess
            }));
        } else {
            therapistDB.login(req.body.username, req.body.password, function (sucess) {
                if (sucess) {
                    res.writeHead(200, {
                        "Content-Type": "application/json"
                    });
                    res.end(JSON.stringify({
                        token: sucess
                    }));
                } else {
                    res.writeHead(403, {
                        "Content-Type": "application/json"
                    });
                    res.end(JSON.stringify({
                        error: "Invalid password"
                    }));
                }
            });
        }
    });
}

// Renders the login page for a user
// Request Response -> Void
exports.show_login =  function(req, res) {
    res.render('login');
}