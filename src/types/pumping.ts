/**
 * Pumping Lemma Proof Game Domain Types
 */

export interface RegularLanguageDef {
  id: string;
  name: string;
  description: string;
  alphabet: string[];
  isInLanguage: (w: string) => boolean;
  generateString: (m: number) => string;
}

export interface RegularPartition {
  x: string;
  y: string;
  z: string;
}

export interface CFLanguageDef {
  id: string;
  name: string;
  description: string;
  alphabet: string[];
  isInLanguage: (w: string) => boolean;
  generateString: (m: number) => string;
}

export interface CFPartition {
  u: string;
  v: string;
  x: string;
  y: string;
  z: string;
}
