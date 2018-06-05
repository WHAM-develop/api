// Returns every message this therapist has sent
// Request Response TherapistDB -> Void
exports.getMessagesFromTherapist = function (req, res, therapistDB, authorizer) {
    authorizer.verifyJWT(req, function (verified) {
        if (!verified) {
            res.redirect(req.baseUrl + '/login');
            return;
        }
        var therapistID = req.params.therapistID;
        authorizer.isAllowed(verified, therapistID, '*', function (err, can_view) {
            if (can_view) {
                therapistDB.get_all_messages_from(therapistID, function (messages) {
                    if (req.headers['accept'].includes('text/html')) {
                        res.render("therapist/therapist-messages", {
                            therapistID: therapistID,
                            messages: messages
                        });
                    } else if (req.headers['accept'].includes('application/json')) {
                        if (messages === false) {
                            res.writeHead(403, {
                                "Content-Type": "application/json"
                            });
                            res.end();
                        } else {
                            res.writeHead(200, {
                                "Content-Type": "application/json"
                            });
                            res.end(JSON.stringify(messages));
                        }
                    } else {
                        //An unsupported request
                    }
                })
            } else {
                authorizer.report_not_authorized(req, res);
            }
        });
    });
}