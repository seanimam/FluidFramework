/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { tokens } from "@fluentui/react-components";
import Color from "color";
import React, { useState } from "react";
import {
	Area,
	CartesianGrid,
	ComposedChart,
	Legend,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

interface DataPoint {
	x: string;
	[key: string]: number | string;
}

/**
 * Data To be rendered with Op Latency Graph
 */
export interface GraphDataSet {
	graphType: "line" | "area";
	schema: {
		displayName: string;
		uuid: string;
		xAxisDataKey: string;
		yAxisDataKey: string;
	};
	data: { [key: string]: number | string }[];
}

/**
 * Merges multiple {@link GraphDataSet}'s into singular objects by their y-axis (timestamp) value.
 * This method is necessary for showing composed graphs beacause Recharts expects data to be in a merged object format
 *
 * TODO: We will have to update this method as we learn more about the actual schema of the data
 */
const mergeDataSets = (dataSets: GraphDataSet[]): DataPoint[] => {
	const xAxisDataPointToYAxisDataPointMap: Record<string, Record<string, number | string>> = {};

	for (const dataSet of dataSets) {
		const { yAxisDataKey, xAxisDataKey, uuid } = dataSet.schema;
		for (const dataPoint of dataSet.data) {
			const xAxisDataPoint = dataPoint[xAxisDataKey];
			xAxisDataPointToYAxisDataPointMap[xAxisDataPoint] = {
				...xAxisDataPointToYAxisDataPointMap[xAxisDataPoint],
				[uuid]: dataPoint[yAxisDataKey],
			};
		}
	}

	return Object.keys(xAxisDataPointToYAxisDataPointMap).map((xAxisKey) => {
		return {
			x: xAxisKey,
			...xAxisDataPointToYAxisDataPointMap[xAxisKey],
		};
	});
};

interface Props {
	stackedAreaChart?: boolean;
	dataSets: GraphDataSet[];
	yAxisUnitDisplayName?: string;
}

const GRAPH_COLOR_PALETTE = [
	tokens.colorPaletteBerryForeground1,
	tokens.colorPaletteForestForeground2,
	tokens.colorPaletteMarigoldForeground1,
	tokens.colorPaletteRoyalBlueForeground2,
	tokens.colorPaletteLavenderForeground2,
];

/**
 * Renders a composed graph from multiple data sets
 */
export function DynamicComposedChart(props: Props): React.ReactElement {
	const [activeIndex, setActiveIndex] = useState<string | undefined>();
	const graphGrayColor = tokens.colorPaletteSteelForeground2;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const handleLegendClick = (e: any): void => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		setActiveIndex(activeIndex === e.dataKey ? undefined : e.dataKey);
	};

	// Recharts doesn't have a type for this
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const renderLegend = (legendProps: any): React.ReactElement => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { payload } = legendProps;

		return (
			<div
				style={{
					display: "flex",
					flexDirection: "row",
					flexWrap: "wrap",
					justifyContent: "center",
				}}
			>
				{/* eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */}
				{payload.map((entry: any, index: number) => {
					// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
					const legendColor: string =
						activeIndex === entry.dataKey || activeIndex === undefined
							? entry.color
							: "#666";

					return (
						<div
							key={`item-${index}`}
							// eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
							onClick={(): void => legendProps.onClick(entry)}
							style={{ color: legendColor, width: "33%", fontSize: 16 }}
						>
							<svg
								width="14"
								height="14"
								style={{ verticalAlign: "middle", marginRight: "5px" }}
							>
								<line
									x1="0"
									y1="7"
									x2="14"
									y2="7"
									style={{ stroke: legendColor, strokeWidth: "2" }}
								/>
								<circle cx="7" cy="7" r="3" fill={legendColor} />
							</svg>
							{entry.value}
						</div>
					);
				})}
			</div>
		);
	};

	/**
	 * Renders a custom view for the X Axis displayed on the Rechart chart
	 */
	// Recharts doesn't have a type for this
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const CustomizedXAxisTick = (xAxisProps: any): React.ReactElement => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { x, y, payload } = xAxisProps;
		return (
			<g transform={`translate(${x},${y})`}>
				<text
					x={0}
					y={0}
					dy={16}
					textAnchor="end"
					fill={graphGrayColor}
					transform="rotate(-35)"
					fontSize={16}
				>
					{payload.value}
				</text>
			</g>
		);
	};

	/**
	 * Renders a custom view for the Y Axis displayed on the Rechart chart
	 */
	// Recharts doesn't have a type for this
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const CustomizedYAxisTick = (yAxisProps: any): React.ReactElement => {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const { x, y, payload } = yAxisProps;
		return (
			<g>
				{/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */}
				<text x={x} y={y} textAnchor="end" fill={graphGrayColor} fontSize={16}>
					{`${payload.value}${props.yAxisUnitDisplayName ?? ""}`}
				</text>
			</g>
		);
	};

	const renderChartData = (
		graphType: "line" | "area",
		name: string,
		hexColor: string,
		dataKey: string,
	): React.ReactElement => {
		if (graphType === "line" && props.stackedAreaChart !== true) {
			return (
				<Line
					name={name}
					key={dataKey}
					type="monotone"
					dataKey={dataKey}
					stroke={hexColor}
					strokeWidth={3}
					activeDot={{ r: 6 }}
					strokeOpacity={activeIndex === undefined || activeIndex === dataKey ? 1 : 0.2}
				/>
			);
		} else {
			let fillOpacity = 0.55;
			if (activeIndex === dataKey) {
				fillOpacity = 1;
			} else if (activeIndex !== undefined) {
				fillOpacity = 0.15;
			}

			return (
				<Area
					name={name}
					key={dataKey}
					type="monotone"
					dataKey={dataKey}
					stroke={hexColor}
					fill={Color(hexColor).lighten(0.5).hex()}
					activeDot={{ r: 6 }}
					strokeOpacity={fillOpacity}
					fillOpacity={fillOpacity}
					stackId={props.stackedAreaChart === true ? "1" : undefined}
				/>
			);
		}
	};

	const renderDataSetGraphComponents = (dataSets: GraphDataSet[]): React.ReactElement[] => {
		const graphComponents: React.ReactElement[] = [];
		let currColorPaletteIndex = 0;
		for (const dataSet of dataSets) {
			if (currColorPaletteIndex > GRAPH_COLOR_PALETTE.length - 1) {
				currColorPaletteIndex = 0;
			}

			graphComponents.push(
				renderChartData(
					dataSet.graphType,
					dataSet.schema.displayName,
					GRAPH_COLOR_PALETTE[currColorPaletteIndex],
					dataSet.schema.uuid,
				),
			);
			currColorPaletteIndex++;
		}

		return graphComponents;
	};

	return (
		<ResponsiveContainer width="100%" height="100%">
			<ComposedChart
				data={mergeDataSets(props.dataSets)}
				margin={{
					top: 5,
					right: 30,
					left: 50,
					bottom: 40,
				}}
			>
				<CartesianGrid strokeDasharray="2 2" />
				<XAxis dataKey={"x"} tick={<CustomizedXAxisTick />} />
				<YAxis tick={<CustomizedYAxisTick />} />
				<Tooltip contentStyle={{ fontSize: "14px" }} />
				<Legend
					wrapperStyle={{ bottom: "-10px", fontSize: "16px" }}
					onClick={handleLegendClick}
					content={renderLegend}
				/>

				{renderDataSetGraphComponents(props.dataSets)}
			</ComposedChart>
		</ResponsiveContainer>
	);
}
