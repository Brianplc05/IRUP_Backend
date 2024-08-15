import model from '../Models/IRLoginModel.js';

const IRLogin = async (req, res) => {
    try {
        const UERMEmail = req.body.UERMEmail;
        const user = await model.getIRUser(UERMEmail);

        if (!user) {
            res.status(401).json({ success: false, message: 'User not found' });
            return;
        }

        const idToken = req.body.token;
        const verifiedUserEmail = await model.verifyGoogleIdToken(idToken);

        if (UERMEmail !== verifiedUserEmail) {
            res.status(401).json({ success: false, message: 'Invalid token for user' });
            return;
        }
        // Proceed with your login logic
        // You may want to generate a session token and return it in the response
        res.status(200).json({ success: true, message: 'Login successful', token: 'YOUR_SESSION_TOKEN' });
    } catch (error) {
        console.error('Google Auth error:', error);
        res.status(500).json({ success: false, message: 'Google Auth error' });
    }
};

export { 
    IRLogin 
};
