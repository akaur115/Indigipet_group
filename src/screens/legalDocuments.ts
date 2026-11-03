export type LegalDocumentData = {
  title: string;
  effectiveDate: string;
  intro: string[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
  }>;
};

// PRIVACY POLICY
export const PRIVACY_POLICY: LegalDocumentData = {
  title: 'IndigiPet Privacy Policy',
  effectiveDate: 'October 26, 2026',

  intro: [
    `This Privacy Policy explains how Giigido Mikinaak ("we", "us", "our") collects, uses, shares and protects personal information when you use the IndigiPet mobile app (the "App"). Giigido Mikinaak is a sole proprietorship based in Winnipeg, Manitoba, Canada.`,

    `By creating an account and using the App, you agree to this Privacy Policy. If you do not agree, please do not use the App.`,
  ],

  sections: [
    {
      heading: '1. Information we collect',
      paragraphs: [
        `Account information. When you create an account, we collect your name, username, email address and password. Your password is handled by Firebase Authentication; we never see or store it in readable form. We send verification codes to your email address to confirm your identity when you sign in.`,

        `Progress and game information. To save your progress, we store your level and experience points, your pet's stats (such as hunger and friendship), your in-app currency balance, which words you have practised and how well you know them, and when you last used the App.`,

        `Usage information. We collect information about how you use the App, such as sign-ups, logins, lessons completed, features used and where people stop using a feature.`,

        `Crash and error information. When the App crashes or has an error, we collect a report that includes your user ID, email address, username and device information (such as device model and operating system version).`,

        `Device information for notifications. If you allow notifications, we store a notification token for your device so we can send you reminders.`,

        `We do not collect your location, contacts, photos or phone number.`,
      ],
    },

    {
      heading: '2. How we use your information',
      paragraphs: [
        `We use your information to:`,

        `• create and secure your account, including sending verification codes`,
        `• save your progress so you can continue on any device you sign in on`,
        `• send notifications, such as a reminder when your pet needs care`,
        `• understand how the App is used so we can improve lessons and design`,
        `• find and fix crashes and bugs`,
        `• respond to your questions and requests`,
        `• comply with the law`,

        `We do not sell your personal information. The App does not show advertising, and we do not use your information to send you marketing emails.`,
      ],
    },

    {
      heading: '3. Services we use',
      paragraphs: [
        `We use the following service providers to run the App. They process your information on our behalf and only for the purposes above.`,

        `• Google Firebase (Authentication, Firestore database, Storage and Cloud Messaging): accounts, saved progress, App content and notifications.`,

        `• Google Analytics for Firebase: usage statistics.`,

        `• PostHog: usage analytics.`,

        `• Sentry.io: crash and error reports.`,
      ],
    },

    {
      heading: '4. Where your information is stored',
      paragraphs: [
        `Your information is stored and processed in the United States, including on Google Firebase servers in the US Central multi-region. Our other service providers may also store information outside Canada [ADD POSTHOG REGION]. Information stored outside Canada may be accessible to courts, law enforcement and national security authorities in those countries under their laws.`,
      ],
    },

    {
      heading: '5. How long we keep your information',
      paragraphs: [
        `We keep your information while your account is active. If you ask us to delete your account, we delete your personal information within 30 days, unless we are required by law to keep it longer. Crash reports and analytics data are kept for the period set by each service provider and are then deleted.`,
      ],
    },

    {
      heading: '6. Deleting your account',
      paragraphs: [
        `You can ask us to delete your account and personal information at any time by emailing support@giigidomikinaak.ca from the email address on your account. Deleting your account permanently removes your progress, pet and in-app currency.`,
      ],
    },

    {
      heading: '7. Notifications',
      paragraphs: [
        `The App can send push notifications. You can turn them off at any time in your device settings.`,
      ],
    },

    {
      heading: '8. Children',
      paragraphs: [
        `The App is intended for users 13 and older. Users under 18 must have permission from a parent or guardian. We do not knowingly collect personal information from children under 13. If we learn that a child under 13 has created an account, we will delete it. If you believe this has happened, contact us at support@giigidomikinaak.ca.`,
      ],
    },

    {
      heading: '9. Security',
      paragraphs: [
        `We use reasonable safeguards to protect your information, including encrypted connections and secure sign-in through Firebase Authentication. No method of storing or sending information online is completely secure, so we cannot guarantee absolute security.`,
      ],
    },

    {
      heading: '10. Your rights',
      paragraphs: [
        `Under Canadian privacy law, you can ask to see the personal information we hold about you, ask us to correct it, or withdraw your consent to our use of it. Withdrawing consent may mean you can no longer use the App. To make a request, email support@giigidomikinaak.ca. We will respond within 30 days.`,

        `If you are not satisfied with our response, you can contact the Office of the Privacy Commissioner of Canada.`,
      ],
    },

    {
      heading: '11. Changes to this policy',
      paragraphs: [
        `We may update this Privacy Policy as the App changes. We will update the effective date at the top, and if the changes are significant we will let you know in the App or by email.`,
      ],
    },

    {
      heading: '12. Contact us',
      paragraphs: [
        `Giigido Mikinaak support@giigidomikinaak.ca 206-295 Stradbrook Ave, Winnipeg, MB R3L 0J5, Canada`,
      ],
    },
  ],
};

// TERMS OF SERVICE
export const TERMS_OF_SERVICE: LegalDocumentData = {
  title: 'IndigiPet Terms of Service',
  effectiveDate: 'October 26, 2026',

  intro: [
    `These Terms of Service ("Terms") are an agreement between you and Giigido Mikinaak ("we", "us", "our"), a sole proprietorship based in Winnipeg, Manitoba, Canada, for your use of the IndigiPet mobile app (the "App"). By creating an account or using the App, you agree to these Terms and to our Privacy Policy at [PRIVACY POLICY URL]. If you do not agree, please do not use the App.`,
  ],

  sections: [
    {
      heading: '1. Who can use the App',
      paragraphs: [
        `You must be at least 13 years old to use the App. If you are under 18, you must have permission from a parent or guardian, and they should read these Terms with you.`,
      ],
    },

    {
      heading: '2. Your account',
      paragraphs: [
        `• You need an account to use the App. Please give accurate information and keep it up to date.`,

        `• Each person may have one account, linked to one email address.`,

        `• Keep your password private. You are responsible for activity on your account.`,

        `• We send verification codes to your email to help keep your account secure.`,

        `• Tell us right away at support@giigidomikinaak.ca if you think someone else has accessed your account.`,
      ],
    },

    {
      heading: '3. Licence to use the App',
      paragraphs: [
        `We give you a personal, non-commercial, non-transferable licence to download and use the App on devices you own or control, while you follow these Terms. We keep all rights not given to you in these Terms.`,

        `If you download the App from Google Play, Google Play's terms of service also apply. Google is not responsible for the App or its content.`,
      ],
    },

    {
      heading: '4. Virtual currency and items',
      paragraphs: [
        `The App lets you earn in-app currency by completing lessons, and spend it on items for your pet.`,

        `• In-app currency and items have no real-world value. They cannot be exchanged for money, sold or transferred to another account.`,

        `• In-app currency can only be earned in the App. It cannot currently be purchased. If we offer purchases in the future, we will update these Terms first.`,

        `• We may adjust, reset or remove in-app currency or items, for example to fix an error or a balance problem in the game.`,

        `• Your in-app currency and items are removed permanently if your account is deleted.`,
      ],
    },

    {
      heading: '5. Acceptable use',
      paragraphs: [
        `You agree not to:`,

        `• use the App for anything illegal or for any commercial purpose`,
        `• try to access other users' accounts or data`,
        `• use bots, scripts or other automated tools with the App`,
        `• copy, change, decompile or reverse engineer the App, except where the law allows`,
        `• interfere with or disrupt the App, its servers or its security features`,
        `• exploit bugs to gain currency, items or progress unfairly`,
      ],
    },

    {
      heading: '6. Intellectual property and cultural content',
      paragraphs: [
        `All content on this platform, including but not limited to language materials, audio recordings, artwork, designs, text, educational materials, and branding, is the property of Giigido Mikinaak or its respective rights holders and is protected by applicable intellectual property laws. Users may not reproduce, redistribute, commercially exploit, modify, or republish content from this platform without prior written permission. Language and cultural materials made available through this platform are intended to support learning, education, and respectful engagement.`,
      ],
    },

    {
      heading: '7. Artificial intelligence and machine learning restrictions',
      paragraphs: [
        `Users may not use any content from this platform, including audio, images, text, language materials, or educational resources, for the training, fine-tuning, development, or evaluation of artificial intelligence or machine learning systems without explicit prior written consent. Unauthorized dataset creation, scraping, or automated collection of platform content for AI-related purposes is strictly prohibited.`,
      ],
    },

    {
      heading: '8. Automated access and scraping',
      paragraphs: [
        `Users may not use bots, scrapers, crawlers, automated scripts, or similar technologies to access, extract, copy, or monitor content or data from the platform without authorization. Any attempt to interfere with the proper operation or security of the platform is prohibited.`,
      ],
    },

    {
      heading: '9. Respectful use of cultural materials',
      paragraphs: [
        `Users agree to engage with the language and cultural materials presented on this platform respectfully and in good faith. Content made available through this platform is intended to support Indigenous language learning, education, and community engagement.`,
      ],
    },

    {
      heading: '10. Educational and informational purposes',
      paragraphs: [
        `Content provided on this platform is intended for educational and informational purposes only. While efforts are made to maintain accurate and respectful content, Giigido Mikinaak makes no guarantees regarding completeness, accuracy, or uninterrupted availability of the platform or its materials.`,
      ],
    },

    {
      heading: '11. Media and audio usage restrictions',
      paragraphs: [
        `Audio recordings, pronunciations, and media content provided on this platform may not be redistributed, repackaged, or commercially reused without prior written permission. Unauthorized downloading or mass reproduction of media content is prohibited.`,
      ],
    },

    {
      heading: '12. Notifications',
      paragraphs: [
        `The App may send push notifications, such as reminders to care for your pet. You can turn them off in your device settings.`,
      ],
    },

    {
      heading: '13. Changes to the App',
      paragraphs: [
        `The App is new and still being developed. We may add, change or remove features, and the App may sometimes be unavailable for maintenance or because of technical problems. We are not responsible for any loss caused by changes or downtime.`,
      ],
    },

    {
      heading: '14. Ending your use of the App',
      paragraphs: [
        `You can stop using the App and ask us to delete your account at any time, as described in our Privacy Policy. We may suspend or delete your account if you break these Terms. If we delete your account, you may not create a new one without our permission.`,
      ],
    },

    {
      heading: '15. Disclaimer',
      paragraphs: [
        `THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE". TO THE FULLEST EXTENT ALLOWED BY LAW, WE MAKE NO WARRANTIES, EXPRESS OR IMPLIED, ABOUT THE APP, INCLUDING THAT IT WILL BE ERROR-FREE, SECURE OR ALWAYS AVAILABLE.`,
      ],
    },

    {
      heading: '16. Limitation of liability',
      paragraphs: [
        `TO THE FULLEST EXTENT ALLOWED BY LAW, GIIGIDO MIKINAAK IS NOT LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL OR CONSEQUENTIAL DAMAGES, OR FOR ANY LOSS OF DATA, PROGRESS OR IN-APP ITEMS, ARISING FROM YOUR USE OF THE APP. BECAUSE THE APP IS FREE, OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM IS LIMITED TO THE AMOUNT YOU HAVE PAID US, IF ANY. SOME LAWS DO NOT ALLOW THESE LIMITS, SO THEY MAY NOT APPLY TO YOU.`,
      ],
    },

    {
      heading: '17. Governing law',
      paragraphs: [
        `These Terms are governed by the laws of the Province of Manitoba and the federal laws of Canada that apply there. Any dispute will be handled by the courts of Manitoba.`,
      ],
    },

    {
      heading: '18. Changes to these Terms',
      paragraphs: [
        `We may update these Terms. We will change the effective date at the top, and if the changes are significant we will let you know in the App or by email. Continuing to use the App after changes take effect means you accept the updated Terms.`,
      ],
    },

    {
      heading: '19. General',
      paragraphs: [
        `If any part of these Terms is found unenforceable, the rest stays in effect. If we do not enforce a part of these Terms, that does not waive our right to enforce it later. These Terms and the Privacy Policy are the full agreement between you and us about the App.`,
      ],
    },

    {
      heading: '20. Contact us',
      paragraphs: [
        `Giigido Mikinaak support@giigidomikinaak.ca 206-295 Stradbrook Ave, Winnipeg, MB R3L 0J5, Canada`,
      ],
    },
  ],
};
