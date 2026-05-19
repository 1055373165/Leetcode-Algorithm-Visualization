import {registerRoot, Composition} from 'remotion';
import React from 'react';
import {LongestSubstringComposition} from './compositions/LongestSubstring';
import {LongestSubstringV2Composition} from './compositions/LongestSubstringV2';
import {totalFrames} from './design';
import {run as runLongestSubstring} from './algorithms/longestSubstring';
import {FindAllAnagramsComposition} from './compositions/FindAllAnagrams';
import {MinSubArrayLenComposition} from './compositions/MinSubArrayLen';
import {MoveZeroesComposition} from './compositions/MoveZeroes';
import {DailyTemperaturesComposition} from './compositions/DailyTemperatures';
import {ShuffleArrayComposition} from './compositions/ShuffleArray';
import {PalindromePartitioningComposition} from './compositions/PalindromePartitioning';
import {RestoreIpAddressesComposition} from './compositions/RestoreIpAddresses';
import {ImplementTrieComposition} from './compositions/ImplementTrie';
import {ZigzagLevelOrderComposition} from './compositions/ZigzagLevelOrder';
import {SlidingWindowMaxComposition} from './compositions/SlidingWindowMax';
import {ZigzagDualStackComposition} from './compositions/ZigzagDualStack';
import {MedianOfTwoSortedArraysComposition, stepsCount as medianStepsCount} from './compositions/MedianOfTwoSortedArrays';

export const RemotionRoot: React.FC = () => {
	return (
		<>
			{/* V1 (legacy snapshot-per-frame style, kept for A/B comparison). */}
			<Composition
				id="LongestSubstring"
				component={LongestSubstringComposition}
				durationInFrames={600}
				fps={30}
				width={1280}
				height={720}
			/>
			{/* V2 — rebuilt on the shared design system. See algo-visualizer/DESIGN.md. */}
			<Composition
				id="LongestSubstringV2"
				component={LongestSubstringV2Composition}
				durationInFrames={totalFrames(runLongestSubstring('abcabcbb'))}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="FindAllAnagrams"
				component={FindAllAnagramsComposition}
				durationInFrames={300}
				fps={30}
				width={1920}
				height={1080}
			/>
            <Composition
				id="MinSubArrayLen"
				component={MinSubArrayLenComposition}
				durationInFrames={300}
				fps={30}
				width={1920}
				height={1080}
			/>
            <Composition
				id="MoveZeroes"
				component={MoveZeroesComposition}
				durationInFrames={300}
				fps={30}
				width={1920}
				height={1080}
			/>


            <Composition
				id="DailyTemperatures"
				component={DailyTemperaturesComposition}
				durationInFrames={300} // May need adjustment based on steps count check?
				fps={30}
				width={1920}
				height={1080}
			/>
            <Composition
				id="ShuffleArray"
				component={ShuffleArrayComposition}
				durationInFrames={300}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="PalindromePartitioning"
				component={PalindromePartitioningComposition}
				durationInFrames={1200}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="RestoreIpAddresses"
				component={RestoreIpAddressesComposition}
				durationInFrames={900}
				fps={30}
				width={1280}
				height={720}
			/>

			<Composition
				id="ImplementTrie"
				component={ImplementTrieComposition}
				durationInFrames={1800}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="ZigzagLevelOrder"
				component={ZigzagLevelOrderComposition}
				durationInFrames={1200}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="SlidingWindowMax"
				component={SlidingWindowMaxComposition}
				durationInFrames={1500}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="ZigzagDualStack"
				component={ZigzagDualStackComposition}
				durationInFrames={1200}
				fps={30}
				width={1280}
				height={720}
			/>
			<Composition
				id="MedianOfTwoSortedArrays"
				component={MedianOfTwoSortedArraysComposition}
				durationInFrames={Math.ceil(medianStepsCount * 2.5 * 30)}
				fps={30}
				width={1280}
				height={720}
			/>
		</>
	);
};

registerRoot(RemotionRoot);

