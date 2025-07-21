import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendCredentialsRequest {
  email: string;
  firstName: string;
  lastName: string;
  userIdLogin: string;
  password: string;
  roleName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, userIdLogin, password, roleName }: SendCredentialsRequest = await req.json();

    const emailResponse = await resend.emails.send({
      from: "HR System <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to Our Company - Your Login Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb; text-align: center;">Welcome to Our Company!</h1>
          
          <p>Dear ${firstName} ${lastName},</p>
          
          <p>Welcome to our team! Your account has been created with the role of <strong>${roleName}</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Your Login Credentials</h3>
            <p><strong>User ID:</strong> ${userIdLogin}</p>
            <p><strong>Temporary Password:</strong> ${password}</p>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">⚠️ Security Notice:</p>
          <ul style="color: #374151;">
            <li>Please change your password after your first login</li>
            <li>Keep your credentials confidential</li>
            <li>Contact IT support if you experience any login issues</li>
          </ul>
          
          <p>You can access the system at: <a href="${Deno.env.get("SITE_URL") || "https://your-app-url.com"}" style="color: #2563eb;">Company Portal</a></p>
          
          <p>If you have any questions, please don't hesitate to contact the HR department.</p>
          
          <p>Best regards,<br>
          <strong>HR Team</strong></p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `,
    });

    console.log("User credentials email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, messageId: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending user credentials email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);