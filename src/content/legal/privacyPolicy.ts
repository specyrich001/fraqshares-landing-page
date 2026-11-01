import { PRIVACY_POLICY_HREF } from '../../components/siteLinks.ts'
import type { LegalDocument } from './types.ts'

// The Privacy Policy, as supplied in Figma (Privacy policy, 11121:115520), word for word: only the
// apostrophes are typographic. Sections 7 and 10's numbered sub-clauses are Medium #111, as in the design
// (and the Terms). Section 1 links to this same page, as drawn (copied from the Terms' section 12).

export const PRIVACY_POLICY: LegalDocument = {
  id: 'privacy-title',
  title: ['Privacy', 'policy'],
  updated: { label: 'December, 2024', dateTime: '2024-12' },
  sections: [
    {
      title: '1. Privacy Policy',
      blocks: [
        {
          text: 'Our privacy policy explains how we treat Your personal data and protect Your privacy when You use our Service. By using our Service, You agree that the Owner can use such data in the manner described in the our Privacy Policy.',
          link: { text: 'Privacy Policy.', href: PRIVACY_POLICY_HREF },
        },
      ],
    },
    {
      title: '2. Links to Third Party Sites/Services',
      blocks: [
        {
          text: 'The website may contain links to other websites. This Linked Sites are not under our control, and You agree that we are not liable for the contents of any Linked Sites or link contained in any Linked Site.',
        },
      ],
    },
    {
      title: '3. Electronic Communications',
      blocks: [
        {
          text: 'You consent to receive electronic communications, and You agree that all agreements, notices, disclosures and other communications we provide to You electronically, via email and on this Website, satisfy any legal requirements that communications must be in writing.',
        },
      ],
    },
    {
      title: '4. Reverse Engineering and Security',
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
      title: '5. Change to Service',
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
      title: '6. Indemnification',
      blocks: [
        {
          text: 'You hereby agree to indemnify the Owner, its employees, agents; and third parties from and against all liabilities, cost, demands, cause of action, damages; and expenses (including reasonable attorney’s fees) arising out of Your use or inability to use, any uploads made by You, Your violation of any rights of a third party and Your violation of applicable laws, rules or regulation.',
        },
      ],
    },
    {
      title: '7. No Warranties',
      blocks: [
        { clause: '7.1. You agree that You use this Website solely at Your risk as the Owner does not warrant the accuracy of the contents in this Website. You assume all the risk of viewing, reading, or downloading the contents of this Website.' },
        { clause: '7.2. The Owner expressly disclaims all express and implied warranties such as implied warranty of merchantability as the Owner makes no warranties that the Website or other Services will be accurate, error free, secure or uninterrupted.' },
        { clause: '7.3. The Owner makes no warranty about the suitability, reliability, availability, timeliness and accuracy of the information, Contents, Services and other materials contained herein for any purpose. The Owner hereby disclaims all warranties and conditions with regard to the information, software, Products, related graphics and materials, including all implied warranties or conditions of merchantability, fitness for a particular purpose, title, and noninfringement.' },
        { clause: '7.4. You also agree that the Owner and its affiliates shall not be liable for any direct, indirect, punitive and all consequential damages or any damages whatsoever including, but not limited to damages for loss of use, data or profits, the failure to provide Services or for any information, software, Products, Services, related graphics and materials obtained through this Website, or otherwise arising out of the use of this Website, whether based on contract, negligence, strict liability, or otherwise.' },
      ],
    },
    {
      title: '8. Service Interruptions',
      blocks: [
        {
          text: 'The Owner may from time to time interrupt Your access or use of this Website to perform some maintenance or emergency services and You agree that the Owner shall not be held liable for any damage, loss which may arise thereof.',
        },
      ],
    },
    {
      title: '9. Termination/Restriction of Access',
      blocks: [
        {
          text: 'The Owner reserves the right to, at its sole discretion, terminate Your access to this Website and the related Service or any part thereof at any time, for any reason and without notice. The Owner shall have the right to terminate or terminate/suspend Your account for violating the Terms of this Service. If You register with us, You may terminate this Service at any time by issuing a prior notice to us. Once this is done, You will no longer be bound by the provisions of this Terms.',
        },
      ],
    },
    {
      title: '10. General Provisions',
      blocks: [
        { clause: '10.1. Assignment: The Owner shall be permitted to assign, transfer its rights and/or obligations under these Terms. However, You shall not be permitted to assign, transfer any rights and/or obligations under these Terms.' },
        { clause: '10.2. Entire Agreement: These Terms, disclaimers and any other agreement relating to the use of this Website constitutes the entire agreement and shall supersede any other agreement.' },
        { clause: '10.3. Separate Agreements: You may have other legal agreements with us. Those agreements are separate from these Terms. These Terms are not intended to alter, amend, revise or replace the terms of the other agreement.' },
        { clause: '10.4. Applicable law: These Terms may be governed and construed in accordance with the Laws, regulations or guidelines of the Federal Republic of Nigeria and other treaties, or regulations which is applicable in Nigeria.' },
      ],
    },
  ],
}
