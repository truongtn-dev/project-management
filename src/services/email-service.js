import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const emailService = {
    /**
     * Send an email using EmailJS
     * @param {string} toEmail - Recipient email
     * @param {string} toName - Recipient name
     * @param {string} title - Meeting title
     * @param {string} message - Meeting description/message
     * @param {string} link - Link to the meeting or app
     * @param {string} date - Meeting date time string
     */
    sendMeetingInvitation: async (toEmail, toName, title, message, link, date) => {
        console.log('[EmailService] Attempting to send email with keys:', {
            serviceId: !!SERVICE_ID,
            templateId: !!TEMPLATE_ID,
            publicKey: !!PUBLIC_KEY
        });

        if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
            console.error('[EmailService] ERROR: One or more EmailJS environment variables are missing.');
            return;
        }

        try {
            const templateParams = {
                to_email: toEmail,
                to_name: toName,
                meeting_title: title,
                meeting_message: message,
                meeting_link: link,
                meeting_date: date,
                reply_to: 'noreply@projectmanager.com'
            };

            await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
            console.log(`[EmailJS] Sent invitation to ${toEmail}`);
        } catch (error) {
            console.error('[EmailJS] Failed to send email:', error);
            throw error;
        }
    }
};
