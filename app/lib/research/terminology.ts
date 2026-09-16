// Linguistic normalization only: numbers, negation, and substantive qualifiers
// remain required. This does not supply factual policy rules or answer text.
const aliases: Record<string, string> = {
  comp: 'comparable', comps: 'comparable', photo: 'photograph', photos: 'photograph', photographs: 'photograph', pictures: 'photograph', images: 'photograph',
  financially: 'financial', interested: 'interest', supply: 'provide', supplied: 'provide',
  permit: 'acceptable', permitted: 'acceptable', permits: 'acceptable', allowed: 'acceptable',
  prescribe: 'require', fixed: 'arbitrary', alone: 'sole', reject: 'acceptability', rejection: 'acceptability',
  scarce: 'shortage', scarcity: 'shortage', deducted: 'deduction', deduct: 'deduction', deductions: 'deduction',
  noncomparable: 'not truly comparable', grandfathered: 'nonconforming',
  required: 'require', grounds: 'determinant',
};
export function canonicalWording(text: string) {
  return text.toLowerCase().replace(/non[- ]conforming/g, 'nonconforming')
    .replace(/\bshare\b/g, 'similar')
    .replace(/\b(?:may|many|which|treat|simply|prescribe|apply)\b/g, ' ')
    .replace(/\bas is\b/g, 'condition')
    .replace(/\b[a-z]+\b/g, word => aliases[word] ?? word);
}

// A universal premise can be answered by quoting an explicit exception or
// prohibition. The engine still requires every other substantive term and topic.
export function hasExplicitQualification(text: string) {
  return /\b(?:not appropriate|not acceptable|except(?:ion)?|provided that)\b/i.test(text);
}
