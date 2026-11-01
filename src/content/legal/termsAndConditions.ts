import { CONTACT_DETAILS } from '../../components/contact/contactDetails.ts'
import { PRIVACY_POLICY_HREF } from '../../components/siteLinks.ts'
import type { LegalDocument } from './types.ts'

// The Terms and Conditions, as supplied in Figma (Terms and conditions, 11121:115553), word for word:
// only the quotes and apostrophes are typographic, and stray spaces are trimmed. The design repeats "2. Agreement"
// three times (identical); it's here once. Section 12 links to the Privacy Policy, the closing email
// to support.

export const TERMS_AND_CONDITIONS: LegalDocument = {
  id: 'terms-title',
  title: ['Terms &', 'conditions'],
  updated: { label: 'December, 2024', dateTime: '2024-12' },
  intro:
    'These terms and conditions apply to You, the user of this website (including any sub-domains, unless expressly excluded by their own terms and conditions), and Fraqshares, the owner and operator of this website.\n\nPlease read the Terms and Conditions carefully as they affect Your legal right.',
  sections: [
    {
      title: 'Definition',
      blocks: [
        {
          list: [
            '“Parties ” means both You (the user of the Service) and Fraqshares.',
            '“Content” means any content, writing, images, audiovisual content or other information published on this website.',
            '“Your Content” means any audio, video, text, images or other material You choose to display on this Website subject to the restrictions provided in this Agreement.',
            '“Materials” means any materials, information or documentation that we may provide to You in connection with Your use of the Products including documentation, data, information developed any use and other materials which may assist in Your use of the Goods or Service.',
            '“Owner” means Fraqshares.',
            '“Terms” means these terms and conditions.',
            '“Service” means the website including all pages, subpages, all blogs, forums and other connected internet content whatsoever.',
            '“Services” means the services offered on the Website.',
          ],
        },
      ],
    },
    {
      title: '1. About this Website',
      blocks: [
        {
          text: 'The Website is an online store that engages in the provision of Real estate services. This Website is comprised of various web pages operated by Fraqshares.\nThis Service is offered to You upon Your acceptance of the Terms, conditions, and notices contained in these terms. Your use of this Service constitutes Your agreement to all the Terms and Conditions.',
        },
      ],
    },
    {
      title: '2. Agreement',
      blocks: [
        {
          text: 'By using this Website, You acknowledge that You have reviewed, considered the Terms of this Agreement and understand same and agree to be bound by it.\nIf You u do not agree with these Terms or do not intend to be bound by it, You must quit the use of this Website immediately. In addition, when using these Service, You shall be subject to any posted guidelines or rules applicable to such services. Accordingly, any participation in this Service shall constitute acceptance of this Agreement.\nBy using this Website and agreeing to these Terms, You represent and warrant that You have the legal capacity to accept these Terms.',
        },
      ],
    },
    {
      title: '3. Acceptable Use',
      blocks: [
        {
          bullets: true,
          list: [
            'We hereby grant You the license to use our Service for Your personal, non- commercial use to retrieve, display and view the Content on a computer screen.',
            'The license created under these Terms is limited, non-exclusive, non-transferable and revocable.',
            'You agree that You will not use the Contents or Materials for any other purpose which may be contrary to your license to use this Service.',
            'Any unauthorized use by You shall terminate the permission or license granted by this Website.',
            'We may provide You with other items in connection with Your use of this Service.',
          ],
        },
      ],
    },
    {
      title: '4. Prohibited Use',
      blocks: [
        { clause: '4.1. You agree not to use the Service in the following manner:' },
        {
          list: [
            'To harass, abuse or threaten others or otherwise violate any person’s legal rights;',
            'To perpetrate fraud;',
            'To create or transmit unnecessary spam to any person or URL;',
            'To post, transmit or cause to be posted or transmitted, any communication or solicitation designed to obtain password, account, or private information of other Users or persons',
            'To post copyrighted content which does not belong to You and without obtaining the prior consent of the author;',
            'To use robot, spider, scraper or other automated means to access this Service without obtaining the prior consent of the Owner;',
            'To engage in or create any unlawful gambling, sweepstakes, or scheme;',
            'Publishing or distributing any other obscene or defamatory material;',
            'Using this Service in any way that impacts user access to the Website;',
            'To engage in advertisement or solicit any User to buy or sell products or services without obtaining the prior consent of the Owner;',
            'Disseminating computer viruses or other software:',
            'Violating any intellectual property rights of the Owner or any third party;',
            'To use the Website or any of the Services for illegal spam activities.',
          ],
        },
        { clause: '4.2. Additionally, you agree that You will not do as follows:' },
        {
          list: [
            'Interfere or attempt to interfere with the proper working of this Website or',
            'Bypass any measures we may use to prevent or restrict access to this Website;',
            'Interfere with or circumvent the security features of this Service;',
            'Damage, disable, overburden or impair this Service or any other person’s use of this Service.',
            'Use this Service contrary to the applicable laws and regulations or in a way that causes, or may cause harm to this Website, any person or business entity.',
          ],
        },
        {
          clause:
            '4.3. The Owner has the authority to review all content posted by the Users on this Website and we reserve the right to terminate Your use of the Service for violating any of the prohibited uses.',
        },
        {
          clause:
            '4.4. You acknowledge that the Website does not control the content or any information that may be posted by other users. Consequently, it is not responsible or liable for those contents or information.',
        },
      ],
    },
    {
      title: '5. Intellectual Property Ownership',
      blocks: [
        {
          clause:
            '5.1. You agree that we retain ownership of all Content included on the Website (text, graphics, video, software, data, page layout, images, and any other information capable of being stored in a computer) other than the contents uploaded by users',
        },
        {
          clause:
            '5.2. You are granted a limited license only, subject to the restrictions provided in this Terms, nothing on this Website shall be construed as granting any license or right to use any trademark or logo displayed on the Website without obtaining the prior written consent of the Owner.',
        },
        {
          clause:
            '5.3. You hereby agree not to reproduce or distribute the Owner’s intellectual property or use the intellectual property for any unlawful purpose.',
        },
      ],
    },
    {
      title: '6. User Account',
      blocks: [
        { clause: '6.1. You may be required to register with us to have access to our Service.' },
        {
          clause:
            '6.2. You will be required to provide certain personal information, which includes but not limited to Your name, username, email address and password. The information provided must be correct and accurate.',
        },
        {
          clause:
            '6.3. This personal information must not be disseminated to anyone and when You discover that Your information has been compromised, You agree to notify us immediately. You also acknowledge that You are responsible for the security of Your personal information and that the Owner does not accept liability for the security of Your account as You agree to be responsible for maintaining the confidentiality of Your passwords or other account identifiers which You choose and all activities under Your account.',
        },
        { clause: '6.4. The Owner reserves the right to terminate Your account where You have information.' },
        {
          clause:
            '6.5. It is at the sole discretion of the Owner to terminate the account or refuse to sell any Services to any User at any time and for any reason.',
        },
      ],
    },
    {
      title: '7. Sale of Goods/Services',
      blocks: [
        {
          clause:
            '7.1. The Website may offer Products or Services for sale. We undertake to give accurate information about the description of the Products and Services.',
        },
        { clause: '7.2. We reserve the right to refuse to sell the Services provided on the Website at our sole discretion.' },
      ],
    },
    {
      title: '8. Payment and Billing',
      blocks: [
        {
          clause:
            '8.1. If You register for our Service or to purchase any Services offered on this Website, You agree to pay the full price for the Services when the purchase is made.',
        },
        { clause: '8.2. The total price will also include the taxes applicable on the date of purchase.' },
        {
          clause:
            '8.3. The total price of the Services provided including all applicable taxes is included upon the confirmation of Your order.',
        },
      ],
    },
    {
      title: '9. Unauthorized Debit Transactions',
      blocks: [
        {
          clause:
            '9.1. If you believe that an unauthorized debit has occurred on your account, you must notify us immediately by contacting us via our email. Upon receiving your notification, we will promptly investigate the matter. You may be required to provide additional information or documentation to assist in the investigation. During the investigation, we may temporarily suspend your account to prevent further unauthorized transactions.',
        },
        {
          clause:
            '9.2. You are not responsible for an unauthorized debit if we complete an investigation and discover that:',
        },
        {
          list: [
            'The account was used by someone else other than you;',
            'You did not receive any benefit from the transaction; and',
            'You co-operated fully with us during our investigation.',
          ],
        },
      ],
    },
    {
      title: '10. Cancellation',
      blocks: [
        {
          clause:
            '10.1. You may cancel our services at any time by making an application via our email. The notice must include the domain name, account details, and the reason for cancellation.',
        },
        {
          clause:
            '10.2. The cancellation will take effect within 30 days from the date the notice is received by us, unless otherwise specified.',
        },
      ],
    },
    {
      title: '11. Refunds',
      blocks: [
        {
          text: 'Refunds shall be managed by us and may be amended from time to time. Acceptance of request for refunds shall be in our discretion subject to compliance with applicable laws of the territory.',
        },
        {
          list: [
            'You must make an application for refund to our email address within 7 days from the date of payment for our services.',
            'You must provide a valid proof of payment through our website.',
          ],
        },
      ],
    },
    {
      title: '12. Privacy Policy',
      blocks: [
        {
          text: 'Our privacy policy explains how we treat Your personal data and protect Your privacy when You use our Service. By using our Service, You agree that the Owner can use such data in the manner described in the our Privacy Policy.',
          link: { text: 'Privacy Policy', href: PRIVACY_POLICY_HREF },
        },
      ],
    },
    {
      title: '13. Links to Third Party Sites/Services',
      blocks: [
        {
          text: 'The website may contain links to other websites. This Linked Sites are not under our control, and You agree that we are not liable for the contents of any Linked Sites or link contained in any Linked Site.',
        },
      ],
    },
    {
      title: '14. Electronic Communications',
      blocks: [
        {
          text: 'You consent to receive electronic communications, and You agree that all agreements, notices, disclosures and other communications we provide to You electronically, via email and on this Website, satisfy any legal requirements that communications must be in writing.',
        },
      ],
    },
    {
      title: '15. Reverse Engineering and Security',
      blocks: [
        { text: 'You hereby agree as follows:' },
        {
          list: [
            'Not to reverse engineer or permit the reverse engineering or dissemble any code or software from or on the Website or Services; and',
            'Not to violate the Security of the Website or other Services through any unauthorized access, circumvention of encryption or other security tools, data mining or interference with any host or User or network.',
          ],
        },
      ],
    },
    {
      title: '16. Change to Service',
      blocks: [
        {
          list: [
            'You accept that the Owner may vary, alter, amend, or update the Content or Service, Services at any time and without Your consent.',
            'You also agree that the Services may not be available at all times and this may be as a result of the maintenance or for any other reason and we shall not be held liable for the failure to provide this Service.',
          ],
        },
      ],
    },
    {
      title: '17. Indemnification',
      blocks: [
        {
          text: 'You hereby agree to indemnify the Owner, its employees, agents; and third parties from and against all liabilities, cost, demands, cause of action, damages; and expenses (including reasonable attorney’s fees) arising out of Your use or inability to use, any uploads made by You, Your violation of any rights of a third party and Your violation of applicable laws, rules or regulation.',
        },
      ],
    },
    {
      title: '18. No Warranties',
      blocks: [
        {
          clause:
            '18.1. You agree that You use this Website solely at Your risk as the Owner does not warrant the accuracy of the contents in this Website. You assume all the risk of viewing, reading, or downloading the contents of this Website.',
        },
        {
          clause:
            '18.2. The Owner expressly disclaims all express and implied warranties such as implied warranty of merchantability as the Owner makes no warranties that the Website or other Services will be accurate, error free, secure or uninterrupted.',
        },
        {
          clause:
            '18.3. The Owner makes no warranty about the suitability, reliability, availability, timeliness and accuracy of the information, Contents, Services and other materials contained herein for any purpose. The Owner hereby disclaims all warranties and conditions with regard to the information, software, Products, related graphics and materials, including all implied warranties or conditions of merchantability, fitness for a particular purpose, title, and noninfringement.',
        },
        {
          clause:
            '18.4. You also agree that the Owner and its affiliates shall not be liable for any direct, indirect, punitive and all consequential damages or any damages whatsoever including, but not limited to damages for loss of use, data or profits, the failure to provide Services or for any information, software, Products, Services, related graphics and materials obtained through this Website, or otherwise arising out of the use of this Website, whether based on contract, negligence, strict liability, or otherwise.',
        },
      ],
    },
    {
      title: '19. Service Interruptions',
      blocks: [
        {
          text: 'The Owner may from time to time interrupt Your access or use of this Website to perform some maintenance or emergency services and You agree that the Owner shall not be held liable for any damage, loss which may arise thereof.',
        },
      ],
    },
    {
      title: '20. Termination/Restriction of Access',
      blocks: [
        {
          text: 'The Owner reserves the right to, at its sole discretion, terminate Your access to this Website and the related Service or any part thereof at any time, for any reason and without notice. The Owner shall have the right to terminate or terminate/suspend Your account for violating the Terms of this Service. If You register with us, You may terminate this Service at any time by issuing a prior notice to us. Once this is done, You will no longer be bound by the provisions of this Terms.',
        },
      ],
    },
    {
      title: '21. General Provisions',
      blocks: [
        {
          clause:
            '21.1. Assignment: The Owner shall be permitted to assign, transfer its rights and/or obligations under these Terms. However, You shall not be permitted to assign, transfer any rights and/or obligations under these Terms.',
        },
        {
          clause:
            '21.2. Entire Agreement: These Terms, disclaimers and any other agreement relating to the use of this Website constitutes the entire agreement and shall supersede any other agreement.',
        },
        {
          clause:
            '21.3. Separate Agreements: You may have other legal agreements with us. Those agreements are separate from these Terms. These Terms are not intended to alter, amend, revise or replace the terms of the other agreement.',
        },
        {
          clause:
            '21.4. Applicable law: These Terms may be governed and construed in accordance with the Laws, regulations or guidelines of the Federal Republic of Nigeria and other treaties, or regulations which is applicable in Nigeria.',
        },
      ],
    },
    {
      title: 'Contact Us',
      blocks: [
        {
          text: `If you have any questions about this Terms, or the Services, you can contact ${CONTACT_DETAILS.email}`,
          link: { text: CONTACT_DETAILS.email, href: `mailto:${CONTACT_DETAILS.email}`, plain: true },
        },
      ],
    },
  ],
}
