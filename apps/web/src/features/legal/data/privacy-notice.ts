/**
 * Toyota Privacy Notice data
 * Structured content for the Privacy Policy page
 */

export interface LegalSection {
  heading?: string;
  list?: {
    items: (string | { text: string; subitems?: string[] })[];
  };
  paragraphs: (string | Array<{ text: string; bold?: boolean }>)[];
}

export interface PrivacyNoticeData {
  lastUpdated: string;
  sectionHeading: string;
  sections: LegalSection[];
  title: string;
  updatedLabel: string;
}

/**
 * Privacy Notice content for Toyota
 * Data-driven structure for the privacy page
 */
export const PRIVACY_NOTICE: PrivacyNoticeData = {
  title: "Your Privacy Rights",
  sectionHeading: "Toyota Privacy Notice",
  lastUpdated: "April 7, 2026",
  updatedLabel: "UPDATED AS OF:",
  sections: [
    {
      paragraphs: [
        [
          {
            text: 'Toyota Motor Sales, U.S.A., Inc. and its parent Toyota Motor North America, Inc. (collectively, "Toyota," "us," or "our") are committed to maintaining your confidence and trust as it relates to the privacy of your Personal Information. "Personal Information" is sometimes also referred to as personal data, personally identifiable information or other like terms that mean any information that directly or indirectly identifies you or is reasonably capable of being associated with you. ',
          },
          {
            text: "For purposes of this Privacy Notice, Personal Information does not include the following:",
            bold: true,
          },
        ],
      ],
      list: {
        items: [
          "Publicly available information: information that is lawfully made available to the general public through government records, by you or from widely distributed media, or by a person to whom you have disclosed the information, unless you have restricted the information to a specific audience.",
          "De-identified (which we commit to keep de-identified), anonymized, or aggregated information.",
          {
            text: "Other regulated information to the extent it is excluded from the scope of United States comprehensive consumer privacy laws, such as:",
            subitems: [
              "Medical information governed by the California Confidentiality of Medical Information Act (CMIA);",
              "Protected health information collected by a covered entity or business associate governed by the Health Insurance Portability and Accountability Act of 1996 (HIPAA);",
              "Clinical trial data or other biomedical research data subject to the Federal Policy for the Protection of Human Subjects; and",
              "Personal information covered by certain sector-specific privacy laws, including the Fair Credit Reporting Act (FCRA), the Gramm-Leach-Bliley Act (GLBA), the California Financial Information Privacy Act (FIPA), and the Driver's Privacy Protection Act of 1994.",
            ],
          },
        ],
      },
    },
    {
      paragraphs: [
        'Please read below and learn how we collect, protect, share, and use your Personal Information including information we collect as part of our technology Platforms (including, without limitation, our Toyota-owned and branded websites, web pages, interactive features, applications, and mobile applications that link to this Privacy Notice ("Platforms"), offline, and from other parties).',
        [
          { text: "United States Only.", bold: true },
          {
            text: " This Privacy Notice describes our practices with respect to Personal Information collected regarding individuals in the United States. If you are located in another country, please review the applicable Toyota privacy notice for your country.",
          },
        ],
      ],
    },
  ],
};
