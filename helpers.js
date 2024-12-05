export const validateInput = (input, type) => {
    switch (type) {
      case 'email':
        return validateEmail(input);
      case 'alphanumeric':
        return validateAlphanumeric(input);
      case 'numeric':
        return validateNumeric(input);
      case 'nonEmpty':
        return validateNonEmpty(input);
      default:
        throw new Error('Unknown validation type');
    }
  };
  
  // Helper functions
  const validateEmail = (email) => {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  };
  
  const validateAlphanumeric = (text) => {
    const alphanumericRegex = /^[\w\-\s]+$/;
    return alphanumericRegex.test(text);
  };
  
  const validateNumeric = (text) => {
    const numericRegex = /^\d+$/;
    return numericRegex.test(text);
  };
  
  const validateNonEmpty = (text) => {
    return text && text.trim().length > 0;
  };