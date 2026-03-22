export type SvgBounds = {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
};

export const createEmptyBounds = (): SvgBounds => ({
	minX: Number.POSITIVE_INFINITY,
	minY: Number.POSITIVE_INFINITY,
	maxX: Number.NEGATIVE_INFINITY,
	maxY: Number.NEGATIVE_INFINITY,
});

export const includePointInBounds = (
	bounds: SvgBounds,
	{
		x,
		y,
		radius = 0,
		extraLeft = 0,
		extraRight = 0,
		extraTop = 0,
		extraBottom = 0,
	}: {
		x: number;
		y: number;
		radius?: number;
		extraLeft?: number;
		extraRight?: number;
		extraTop?: number;
		extraBottom?: number;
	},
): void => {
	bounds.minX = Math.min(bounds.minX, x - radius - extraLeft);
	bounds.minY = Math.min(bounds.minY, y - radius - extraTop);
	bounds.maxX = Math.max(bounds.maxX, x + radius + extraRight);
	bounds.maxY = Math.max(bounds.maxY, y + radius + extraBottom);
};

export const toPaddedViewBox = (
	bounds: SvgBounds,
	{
		padding = 0,
		minWidth = 0,
		minHeight = 0,
	}: {
		padding?: number;
		minWidth?: number;
		minHeight?: number;
	} = {},
): string => {
	if (
		!Number.isFinite(bounds.minX) ||
		!Number.isFinite(bounds.minY) ||
		!Number.isFinite(bounds.maxX) ||
		!Number.isFinite(bounds.maxY)
	) {
		return `0 0 ${Math.max(minWidth, 1)} ${Math.max(minHeight, 1)}`;
	}

	const rawWidth = bounds.maxX - bounds.minX;
	const rawHeight = bounds.maxY - bounds.minY;
	const targetWidth = Math.max(rawWidth + padding * 2, minWidth, 1);
	const targetHeight = Math.max(rawHeight + padding * 2, minHeight, 1);
	const centerX = (bounds.minX + bounds.maxX) / 2;
	const centerY = (bounds.minY + bounds.maxY) / 2;

	return `${centerX - targetWidth / 2} ${
		centerY - targetHeight / 2
	} ${targetWidth} ${targetHeight}`;
};
