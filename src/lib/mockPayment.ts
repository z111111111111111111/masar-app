export interface CardInfo {
  cardNumber: string;
  expiryDate: string; // MM/YY
  cvv: string;
  name: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Luhn algorithm check (simplified for mock)
export function validateCardNumber(number: string): boolean {
  const digits = number.replace(/\D/g, '');
  if (digits.length !== 16) return false;
  // Let's accept any 16-digit card that doesn't end in 0000
  return true;
}

export function validateExpiry(expiry: string): boolean {
  const match = expiry.match(/^(0[1-9]|1[0-2])\/([0-9]{2})$/);
  if (!match) return false;

  const month = parseInt(match[1], 10);
  const year = parseInt(`20${match[2]}`, 10);
  const now = new Date();
  
  if (year < now.getFullYear()) return false;
  if (year === now.getFullYear() && month < now.getMonth() + 1) return false;
  
  return true;
}

export async function processPayment(card: CardInfo): Promise<PaymentResult> {
  const digits = card.cardNumber.replace(/\D/g, '');
  
  // Fake processing delay (2 seconds)
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (digits.length !== 16) {
    return { success: false, error: 'رقم البطاقة غير صحيح.' };
  }

  // Reject rule: ends in 0000
  if (digits.endsWith('0000')) {
    return { success: false, error: 'تم رفض البطاقة. يرجى مراجعة البنك.' };
  }

  // Accept everything else that has 16 digits
  return {
    success: true,
    transactionId: 'TXN_' + Math.random().toString(36).substring(2, 9).toUpperCase()
  };
}
