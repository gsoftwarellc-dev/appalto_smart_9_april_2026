export const getContractorDisplayName = (source, fallback = 'Unknown Contractor') => {
    const contractor = source?.contractor ?? source;

    return (
        contractor?.company_name ||
        source?.contractor_company ||
        contractor?.legal_representative ||
        contractor?.name ||
        source?.contractorName ||
        source?.contractor_name ||
        fallback
    );
};

export const getContractorInitial = (source, fallback = 'C') => {
    const displayName = getContractorDisplayName(source, fallback);
    return displayName.trim().charAt(0).toUpperCase() || fallback;
};
