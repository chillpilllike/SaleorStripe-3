/** @type {import('next').NextConfig} */
const config = {
	images: {
		remotePatterns: [
			{
				hostname: "*",
			},
		],
	},
	experimental: {
		typedRoutes: false,
	},
	// Used in the Dockerfile
	output:
		process.env.NEXT_OUTPUT === "standalone"
			? "standalone"
			: process.env.NEXT_OUTPUT === "export"
				? "export"
				: undefined,

	// Enable body parsing for API routes
	eslint: {
		ignoreDuringBuilds: true, // Ignore ESLint errors during the build process
	  },
	
	api: {
		bodyParser: true, // Ensures automatic JSON body parsing
	},
	typescript: {
		ignoreBuildErrors: true,
	  },
};

export default config;
