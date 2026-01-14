# Email Signature Setup Instructions

This guide will help you set up your Europe Incoming email signature in Outlook.

---

## Step 1: Customize Your Signature

Open the `outlook-signature.html` file and update the following 4 items with your personal details:

### 1. Profile Photo (Line 16)
Replace `YOUR_PROFILE_IMAGE_URL_HERE` with your profile photo URL.

**How to get your photo URL:**
- Upload your professional headshot to the company website or a hosting service
- Copy the direct image URL
- The photo should be square (recommended: 300x300px minimum)

**Example:**
```html
<img src="https://www.europeincoming.com/staff-photos/yourname.jpg" alt="Profile Photo" ...>
```

### 2. Your Name (Line 20)
Replace `Alex Bennett` with your full name.

```html
<div style="font-size: 16px; font-weight: bold; color: #333333; margin-bottom: 4px;">Your Name</div>
```

### 3. Your Title (Line 21)
Replace `Marketing Director | Marketing` with your job title and department.

```html
<div style="font-size: 13px; color: #666666;">Your Job Title | Your Department</div>
```

### 4. Contact Information (Lines 36 and 43)

**Phone Numbers (Line 36):**
```html
<span style="color: #666666;">+44 (0) XXX XXX XXXX | +44 (0) XXX XXX XXXX</span>
```
- Replace with your direct line and mobile number
- If you only have one number, remove the ` | +44 (0) XXX XXX XXXX` part

**Email Address (Line 43):**
```html
<a href="mailto:your.name@syncanddeliver.com" style="color: #666666; text-decoration: none;">your.name@syncanddeliver.com</a>
```
- Replace both instances with your company email address
- Keep the `mailto:` prefix in the `href` attribute

---

## Step 2: Install in Outlook

### For Outlook on Windows:

1. Copy the **entire contents** of your customized `outlook-signature.html` file
2. Open Outlook and go to **File → Options → Mail → Signatures**
3. Click **New** to create a new signature
4. Give it a name (e.g., "Europe Incoming")
5. In the signature editor, click the **source code button** (usually labeled `<>` or "HTML")
6. Paste your HTML code
7. Click **OK** to save
8. Set it as your default signature for new emails and replies

### For Outlook on Mac:

1. Copy the **entire contents** of your customized `outlook-signature.html` file
2. Open Outlook and go to **Outlook → Preferences → Signatures**
3. Click the **+** button to create a new signature
4. Give it a name (e.g., "Europe Incoming")
5. In the signature editor, go to **Edit → Insert HTML**
6. Paste your HTML code
7. Click **OK** to save
8. Set it as your default signature

### For Outlook Web (Office 365):

1. Copy the **entire contents** of your customized `outlook-signature.html` file
2. Go to [outlook.office.com](https://outlook.office.com)
3. Click the **Settings gear icon** (⚙️) in the top right
4. Click **View all Outlook settings**
5. Go to **Mail → Compose and reply**
6. Under **Email signature**, paste your HTML code in the text box
7. Check the boxes:
   - ☑ **Automatically include my signature on new messages I compose**
   - ☑ **Automatically include my signature on messages I forward or reply to** (optional)
8. Click **Save**

---

## Troubleshooting

### Images not displaying?
- Make sure your profile photo URL is publicly accessible
- Test the URL by pasting it in a browser - the image should display
- Ensure you're using the full URL (starting with `https://`)

### Signature looks broken?
- Make sure you copied the **entire** HTML file contents
- Don't modify the code structure, only the 4 items listed above
- Make sure all quotation marks and brackets are intact

### Links not working?
- Verify the `href` attributes include `mailto:` for emails and `https://` for websites
- Test links by clicking them in a test email

### Social media icons not showing?
- The social media icons use public URLs and should work automatically
- If they don't display, check your email client's image settings

---

## Need Help?

If you encounter any issues setting up your signature, please contact:
- **IT Support** for technical assistance
- **Marketing** for profile photo uploads or branding questions

---

**Last Updated:** January 2026
**Template Version:** 1.0
