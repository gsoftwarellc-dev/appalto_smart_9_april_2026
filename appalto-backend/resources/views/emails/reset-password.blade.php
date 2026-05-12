<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset your password</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f0f4ff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .wrapper { padding: 40px 16px; }
        .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
        .header { background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%); padding: 36px 40px; text-align: center; }
        .header img { height: 52px; border-radius: 8px; margin-bottom: 16px; }
        .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
        .body { padding: 40px; }
        .body p { margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6; }
        .body p.muted { color: #6b7280; font-size: 13px; }
        .btn-wrap { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background: #1d4ed8; color: #ffffff !important; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.2px; }
        .divider { border: none; border-top: 1px solid #e5e7eb; margin: 28px 0; }
        .link-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 16px; word-break: break-all; font-size: 12px; color: #6b7280; }
        .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 40px; text-align: center; }
        .footer p { margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>Appalto Smart</h1>
            </div>
            <div class="body">
                <p>Hi,</p>
                <p>We received a request to reset the password for the account associated with <strong>{{ $userEmail }}</strong>.</p>
                <p>Click the button below to choose a new password. This link will expire in <strong>60 minutes</strong>.</p>
                <div class="btn-wrap">
                    <a href="{{ $resetUrl }}" class="btn">Reset Password</a>
                </div>
                <hr class="divider">
                <p class="muted">If the button doesn't work, copy and paste this link into your browser:</p>
                <div class="link-box">{{ $resetUrl }}</div>
                <hr class="divider">
                <p class="muted">If you did not request a password reset, you can safely ignore this email. Your password will not change.</p>
            </div>
            <div class="footer">
                <p>&copy; {{ date('Y') }} Appalto Smart &mdash; appaltosmart.it<br>This is an automated message, please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>
