# Chrome Web Store Submission Guide - FilterTube v3.0.2

## 📦 Build Information

**Version:** 3.0.2  
**Build File:** `dist/filtertube-chrome-v3.0.2.zip`  
**Size:** ~115 KB  
**Manifest Version:** 3  
**Minimum Chrome Version:** 111

---

## 🔗 Privacy Policy URL

**URL:** `https://varshneydevansh.github.io/FilterTube/privacy.html`

(Or use your custom domain if deployed)

---

## 📝 Store Listing Information

### Single Purpose Description
```
FilterTube has one single purpose: to improve the user's YouTube browsing experience by filtering out unwanted videos, channels, and content based on user-defined rules. The extension only modifies the YouTube website to hide or remove elements such as recommendations or specific channels. It performs no other functions outside this purpose.
```

### Permission Justifications

#### storage
```
Storage is used only to save user preferences such as blocked channels, keywords, and filtering options. All data remains on the user's device and is not transmitted anywhere.
```

#### activeTab
```
The activeTab permission is needed so the extension can apply filters on the currently active YouTube tab after the user interacts with the extension. It does not access or modify any other sites or tabs.
```

#### scripting
```
Scripting is required to inject content scripts that hide or modify specific YouTube elements based on user filter rules. These scripts run only on YouTube pages and do not collect or transmit any user data.
```

#### tabs
```
Tabs permission is used only to detect when the user navigates to YouTube so the extension can apply filtering rules. The extension does not read, store, or analyze any content from other tabs.
```

#### Host Permissions (youtube.com, youtubekids.com)
```
Host permission for youtube.com is required so the extension can read and modify the page locally to hide videos, shorts, or channels according to the user's rules. No data is collected; all processing happens on the user's device.
```

---

## 🔒 Data Usage Certification

### Remote Code Usage
**Answer:** No, I am not using Remote code

### Data Collection
**Check NONE of the following:**
- ❌ Personally identifiable information
- ❌ Health information
- ❌ Financial and payment information
- ❌ Authentication information
- ❌ Personal communications
- ❌ Location
- ❌ Web history
- ❌ User activity
- ❌ Website content

### Certifications (Check ALL three)
- ✅ I do not sell or transfer user data to third parties, apart from the approved use cases
- ✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## 📋 Store Listing Content

### Extension Name
```
FilterTube
```

### Short Description (132 characters max)
```
Restore peace of mind to your digital video experience. Filter YouTube content by keywords, channels, and content types.
```

### Detailed Description
```
FilterTube is a powerful, privacy-first YouTube content filter that gives you complete control over what appears in your feed.

🎯 KEY FEATURES

• Keyword Filtering - Block videos containing specific words or phrases
• Channel Blocking - Hide content from unwanted channels
• Shorts Blocker - Disable YouTube Shorts to prevent doom-scrolling
• Comment Control - Hide all comments or filter by keywords
• Zero-Flash Filtering - Content is blocked before it renders (no visual glitches)
• Regex Support - Advanced pattern matching for power users

🔒 PRIVACY FIRST

• 100% Local Processing - All filtering happens on your device
• Zero Tracking - We don't collect any personal data
• Open Source - Fully auditable code on GitHub
• No Analytics - No Google Analytics or tracking scripts
• Manifest V3 - Built on the latest secure extension standard

🚀 HOW IT WORKS

1. Define your filter rules (keywords, channels, content types)
2. FilterTube intercepts YouTube's data before it renders
3. Unwanted content is blocked instantly
4. Enjoy a cleaner, more focused YouTube experience

💡 PERFECT FOR

• Parents protecting children from inappropriate content
• Students staying focused on educational content
• Anyone seeking a more intentional viewing experience
• Users wanting to reduce algorithmic manipulation

🌟 TECHNICAL HIGHLIGHTS

• Zero latency - filters applied before page render
• Optimized performance - minimal resource usage
• Cross-browser compatible (Chrome, Edge, Brave, Opera)
• Regular updates and active development

📖 OPEN SOURCE

FilterTube is completely open source. View the code, contribute, or report issues on GitHub:
https://github.com/varshneydevansh/FilterTube

🆓 FREE FOREVER

No subscriptions, no premium tiers, no hidden costs. FilterTube is and will always be free.

---

Need help? Visit our website or open an issue on GitHub.
```

### Category
**Productivity**

### Language
**English**

---

## 🖼️ Screenshots Required

You'll need to provide:
1. **1280x800 or 640x400** screenshots showing:
   - Extension popup with filters
   - YouTube page with content filtered
   - Settings/options page
   - Before/after comparison

2. **Small promotional tile** (440x280)
3. **Large promotional tile** (920x680) - Optional but recommended
4. **Marquee promotional tile** (1400x560) - Optional

---

## 🎨 Icon Files (Already Included)

- ✅ 16x16 - `icons/icon-16.png`
- ✅ 32x32 - `icons/icon-32.png`
- ✅ 48x48 - `icons/icon-48.png`
- ✅ 128x128 - `icons/icon-128.png`

---

## 📧 Support Information

**Support Email:** varshneydevansh@gmail.com  
**Website:** https://varshneydevansh.github.io/FilterTube  
**GitHub:** https://github.com/varshneydevansh/FilterTube

---

## ✅ Pre-Submission Checklist

- [x] Build created (`filtertube-chrome-v3.0.2.zip`)
- [x] Privacy policy published and accessible
- [x] All permissions justified
- [x] Single purpose clearly defined
- [x] No remote code used
- [x] No data collection
- [x] Icons included (16, 32, 48, 128)
- [ ] Screenshots prepared (you need to create these)
- [ ] Promotional images created (optional)
- [x] Support email verified
- [x] Website/GitHub links working

---

## 🚀 Submission Steps

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `dist/filtertube-chrome-v3.0.2.zip`
4. Fill in all the information from this guide
5. Add screenshots
6. Set privacy policy URL: `https://varshneydevansh.github.io/FilterTube/privacy.html`
7. Review and submit for review

---

## ⏱️ Expected Review Time

- Initial review: 1-3 business days
- If additional info needed: 3-7 business days
- Total time: Usually within 1 week

---

## 📌 Important Notes

1. **Privacy Policy:** Must be publicly accessible before submission
2. **Screenshots:** Show actual extension functionality, not mockups
3. **Description:** Be honest and accurate - no misleading claims
4. **Version Number:** Must match manifest.json (3.0.2)
5. **Updates:** Future updates will be reviewed faster after initial approval

---

## 🔄 Post-Approval

After approval:
1. Extension will be live on Chrome Web Store
2. Update your website with the Chrome Web Store link
3. Monitor reviews and respond to user feedback
4. Plan regular updates based on user needs

---

Good luck with your submission! 🎉
