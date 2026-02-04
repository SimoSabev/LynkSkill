import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const SUPPORT_EMAIL = "lynkskillweb@gmail.com"

interface ContactFormData {
  name: string
  email: string
  message: string
}

/**
 * Sends a contact form message to support
 */
export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json()
    const { name, email, message } = body

    // Validate input
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Send email to support
    const { data, error } = await resend.emails.send({
      from: "LynkSkill Contact Form <noreply@lynkskill.net>",
      to: [SUPPORT_EMAIL],
      replyTo: email,
      subject: `Contact Form: Message from ${name}`,
      html: getContactEmailTemplate({ name, email, message }),
    })

    if (error) {
      console.error("Failed to send contact email:", error)
      return NextResponse.json(
        { error: "Failed to send message. Please try again later." },
        { status: 500 }
      )
    }

    console.log("Contact email sent successfully:", data)
    return NextResponse.json({ success: true, message: "Message sent successfully" })
  } catch (error) {
    console.error("Error in contact form submission:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}

/**
 * Generates the HTML email template for contact form messages
 */
function getContactEmailTemplate({
  name,
  email,
  message,
}: ContactFormData): string {
  const escapedMessage = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form Message</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                New Contact Form Message
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">From:</strong>
                    <span style="color: #6b7280; margin-left: 8px;">${name}</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #374151;">Email:</strong>
                    <a href="mailto:${email}" style="color: #10b981; margin-left: 8px; text-decoration: none;">${email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0 0;">
                    <strong style="color: #374151; display: block; margin-bottom: 12px;">Message:</strong>
                    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; color: #374151; line-height: 1.6;">
                      ${escapedMessage}
                    </div>
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; padding: 16px; background-color: #ecfdf5; border-radius: 8px; border-left: 4px solid #10b981;">
                <p style="margin: 0; color: #065f46; font-size: 14px;">
                  💡 <strong>Tip:</strong> You can reply directly to this email to respond to the user.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                This message was sent from the LynkSkill Help Center contact form.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
