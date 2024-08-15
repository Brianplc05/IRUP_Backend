import mailjet from "node-mailjet";

const mailjetClient = mailjet.apiConnect(
  process.env.MAIL_JET_PUBLIC_KEY,
  process.env.MAIL_JET_PRIVATE_KEY
);

async function sendEmail(emailContent) {
  try {
    const request = await mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: "service-notification@uerm.edu.ph",
            Name: "UERM Service Notification"
          },
          To: [
            {
              Email: emailContent.email,
              Name: emailContent.name
            }
          ],
          TemplateID: 4088864,
          TemplateLanguage: true,
          Subject: emailContent.subject,
          Variables: {
            ehrHeader: emailContent.header,
            ehrContent: emailContent.content
          }
        }
      ]
    });

    console.log(request.body, "body");
    return request.body;
  } catch (err) {
    return err.statusCode;
  }
}



export default {
  sendEmail,
};
