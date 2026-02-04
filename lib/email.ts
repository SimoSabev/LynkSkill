// lib/email.ts
import { Resend } from "resend"

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY)

// Base URL for links
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

interface SendInvitationEmailParams {
  to: string
  companyName: string
  inviterName: string
  role: string
  token: string
  expiresAt: Date
}

/**
 * Sends a team invitation email
 */
export async function sendInvitationEmail({
  to,
  companyName,
  inviterName,
  role,
  token,
  expiresAt,
}: SendInvitationEmailParams) {
  const inviteLink = `${baseUrl}/invitations?token=${token}`
  const expiresFormatted = expiresAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  // Get the role display name
  const roleDisplayName = getRoleDisplayName(role)

  try {
    const { data, error } = await resend.emails.send({
      from: "LynkSkill <noreply@lynkskill.net>",
      to: [to],
      subject: `You've been invited to join ${companyName} on LynkSkill`,
      html: getInvitationEmailTemplate({
        companyName,
        inviterName,
        roleDisplayName,
        inviteLink,
        expiresFormatted,
      }),
    })

    if (error) {
      console.error("Failed to send invitation email:", error)
      return { success: false, error }
    }

    console.log("Invitation email sent successfully:", data)
    return { success: true, data }
  } catch (error) {
    console.error("Error sending invitation email:", error)
    return { success: false, error }
  }
}

/**
 * Gets the human-readable role display name
 */
function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    OWNER: "Owner",
    ADMIN: "Administrator",
    HR_MANAGER: "HR Manager",
    HR_RECRUITER: "HR Recruiter",
    VIEWER: "Viewer",
  }
  return roleMap[role] || role
}

/**
 * Generates the HTML email template for invitations
 */
function getInvitationEmailTemplate({
  companyName,
  inviterName,
  roleDisplayName,
  inviteLink,
  expiresFormatted,
}: {
  companyName: string
  inviterName: string
  roleDisplayName: string
  inviteLink: string
  expiresFormatted: string
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                LynkSkill
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Team Invitation
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 22px; font-weight: 600;">
                You're Invited! 🎉
              </h2>
              
              <p style="margin: 0 0 20px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on LynkSkill as a <strong>${roleDisplayName}</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                LynkSkill is a platform that connects companies with talented interns. By joining ${companyName}'s team, you'll be able to help manage internship programs, review applications, and connect with amazing candidates.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${inviteLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Info Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f5; border-radius: 8px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 10px; color: #71717a; font-size: 14px;">
                      <strong style="color: #3f3f46;">Role:</strong> ${roleDisplayName}
                    </p>
                    <p style="margin: 0; color: #71717a; font-size: 14px;">
                      <strong style="color: #3f3f46;">Expires:</strong> ${expiresFormatted}
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 10px 0 0; word-break: break-all;">
                <a href="${inviteLink}" style="color: #10b981; font-size: 14px;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0 0 10px; color: #71717a; font-size: 14px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © ${new Date().getFullYear()} LynkSkill. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

interface SendWelcomeEmailParams {
  to: string
  userName: string
  companyName: string
  role: string
}

/**
 * Sends a welcome email when a user joins a company
 */
export async function sendWelcomeToTeamEmail({
  to,
  userName,
  companyName,
  role,
}: SendWelcomeEmailParams) {
  const dashboardLink = `${baseUrl}/dashboard/company`
  const roleDisplayName = getRoleDisplayName(role)

  try {
    const { data, error } = await resend.emails.send({
      from: "LynkSkill <noreply@lynkskill.net>",
      to: [to],
      subject: `Welcome to ${companyName}'s team on LynkSkill!`,
      html: getWelcomeEmailTemplate({
        userName,
        companyName,
        roleDisplayName,
        dashboardLink,
      }),
    })

    if (error) {
      console.error("Failed to send welcome email:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    return { success: false, error }
  }
}

function getWelcomeEmailTemplate({
  userName,
  companyName,
  roleDisplayName,
  dashboardLink,
}: {
  userName: string
  companyName: string
  roleDisplayName: string
  dashboardLink: string
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to the Team</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                LynkSkill
              </h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Welcome to the Team!
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #18181b; font-size: 22px; font-weight: 600;">
                Welcome, ${userName}! 🎉
              </h2>
              
              <p style="margin: 0 0 20px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                You've successfully joined <strong>${companyName}</strong>'s team on LynkSkill as a <strong>${roleDisplayName}</strong>.
              </p>
              
              <p style="margin: 0 0 30px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                You can now access the company dashboard to manage internship programs, review applications, and collaborate with your team.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 10px 0 30px;">
                    <a href="${dashboardLink}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 30px; border-radius: 0 0 12px 12px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © ${new Date().getFullYear()} LynkSkill. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
