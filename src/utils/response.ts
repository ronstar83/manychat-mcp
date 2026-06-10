export function formatResponse(data: any) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }]
  };
}

export function handleError(error: any) {
  const details = error?.response?.data || error?.data || error?.cause || null;
  const text = details
    ? `${error.message || String(error)}\n${JSON.stringify(details, null, 2)}`
    : (error.message || String(error));
  return {
    isError: true,
    content: [{ type: "text" as const, text }]
  };
}
