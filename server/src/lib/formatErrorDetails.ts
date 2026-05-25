const formatErrorDetails = (errors: Record<string, string[]>) => {
  let newErrors: Record<string, { message: string }[]> = {};
  const fields = Object.keys(errors);

  for (let field of fields) {
    const messages = errors[field];
    if (messages && messages.length > 0) {
      newErrors[field] = messages.map((message) => ({
        message,
      }));
    }
  }
  return newErrors;
};

export default formatErrorDetails;
