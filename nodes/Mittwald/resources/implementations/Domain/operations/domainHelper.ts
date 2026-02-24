const secondLevelTlds = [
	'co.uk',
	'org.uk',
	'me.uk',
	'co.at',
	'bz.it',
	'co.in',
	'co.nz',
	'com.au',
	'com.tw',
	'com.pl',
	'org.au',
	'de.com',
	'or.at',
	'org.il',
	'com.mx',
	'org.pl',
	'com.pt',
	'co.id',
	'cn.com',
	'ltd.uk',
	'co.jp',
	'firm.in',
	'gen.in',
	'ind.in',
	'org.in',
	'net.in',
	'co.za',
	'uk.com',
	'com.de',
	'co.hu',
	'ae.org',
	'co.nl',
	'com.co',
	'net.au',
	'id.au',
	'com.ph',
	'org.ph',
	'net.ph',
	'com.cm',
	'net.cm',
	'co.cm',
	'com.pe',
	'org.pe',
	'net.pe',
];

export const isSecondLevelTld = (domain: string): boolean => {
	return secondLevelTlds.includes(domain);
};

export const extractBaseDomain = (fullName: string): string => {
	const parts = fullName.split('.');
	if (parts.length < 2) {
		throw new Error('Invalid domain name');
	}

	const baseDomain = parts.slice(-2).join('.');

	if (isSecondLevelTld(baseDomain)) {
		return parts.slice(-3).join('.');
	}

	return baseDomain;
};

export const isSubdomain = (fullName: string): boolean => {
	const baseDomain = extractBaseDomain(fullName);
	return fullName !== baseDomain;
};
