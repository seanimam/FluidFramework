import { IRandom, makeRandom, SpaceEfficientMarkovChain } from "@fluid-internal/stochastic-test-utils";
import {
    createAlphabetFromUnicodeRange,
    getRandomEnglishString,
    getRandomNumberString,
    getSizeInBytes,
} from "./jsonGeneratorUtils";

/**
* This file contains logic to generate a JSON file that is statistically similar to the well-known
* json benchmarks twitter.json - https://github.com/serde-rs/json-benchmark/blob/master/data/twitter.json
*/

/* eslint-disable @rushstack/no-new-null */
export interface TwitterStatus {
    metadata: {
        result_type: string;
        iso_language_code: string;
    };
    created_at: string;
    id: number;
    id_str: string;
    text: string;
    source: string;
    truncated: boolean;
    in_reply_to_user_id: number | null;
    in_reply_to_user_id_str: string | null;
    in_reply_to_screen_name: string | null;
    user: TwitterUser;
    geo: null; // could not find an example of non null value
    coordinates: null; // could not find an example of non null value
    place: null; // could not find an example of non null value
    contributors: null; // could not find an example of non null value
    retweet_count: number;
    favorite_count: number;
    entities: {
        hashtags: {
            text: string;
            indices: number[];
        }[];
        symbols: unknown[]; // could not find a populated value from source json
        urls: {
            url: string;
            expanded_url: string;
            display_url: string;
            indices: number[];
        }[];
        user_mentions: {
            screen_name: string;
            name: string;
            id: number;
            id_str: string;
            indices: number[];
        }[];
        media?: {
            id: number;
            id_str: string;
            indices: number[];
            media_url: string;
            media_url_https: string;
            url: string;
            display_url: string;
            expanded_url: string;
            type: string;
            sizes: {
                large: {
                    w: number;
                    h: number;
                    resize: "fit" | "crop";
                };
                medium: {
                    w: number;
                    h: number;
                    resize: "fit" | "crop";
                };
                thumb: {
                    w: number;
                    h: number;
                    resize: "fit" | "crop";
                };
                small: {
                    w: number;
                    h: number;
                    resize: "fit" | "crop";
                };
            };
            source_status_id?: number;
            source_status_id_str?: string;
        }[];
    };
    favorited: boolean;
    retweeted: boolean;
    lang: string;
    retweeted_status?: Omit<TwitterStatus, "retweeted_status">;
    possibly_sensitive?: boolean;
    in_reply_to_status_id: number | null;
    in_reply_to_status_id_str: string | null;
}

export interface TwitterUser {
    id: number;
    id_str: string;
    name: string;
    screen_name: string;
    location: string;
    description: string;
    url: string | null;
    entities: {
        url?: {
            urls: {
                url: string;
                expanded_url: string;
                display_url: string;
                indices: number[];
            }[];
        };
        description: {
            urls: {
                url: string;
                expanded_url: string;
                display_url: string;
                indices: number[];
            }[];
        };
    };
    protected: boolean;
    followers_count: number;
    friends_count: number;
    listed_count: number;
    created_at: string;
    favourites_count: number;
    utc_offset: number | null;
    time_zone: string | null;
    geo_enabled: boolean;
    verified: boolean;
    statuses_count: number;
    lang: string;
    contributors_enabled: boolean;
    is_translator: boolean;
    is_translation_enabled: boolean;
    profile_background_color: string;
    profile_background_image_url: string;
    profile_background_image_url_https: string;
    profile_background_tile: boolean;
    profile_image_url: string;
    profile_image_url_https: string;
    profile_banner_url?: string;
    profile_link_color: string;
    profile_sidebar_border_color: string;
    profile_sidebar_fill_color: string;
    profile_text_color: string;
    profile_use_background_image: boolean;
    default_profile: boolean;
    default_profile_image: boolean;
    following: boolean;
    follow_request_sent: boolean;
    notifications: boolean;
}
/* eslint-enable */

export interface TwitterJson {
    statuses: TwitterStatus[];
    search_metadata: {
        completed_in: number;
        max_id: number;
        max_id_str: string;
        next_results: string;
        query: string;
        refresh_url: string;
        count: number;
        since_id: number;
        since_id_str: string;
    };
}

/**
* Generates a TwitterJson object as closely as possible to a specified byte size.
* The generated json will as close to the specified size but will almost always be slightly less.
* @param sizeInBytes - size to generate json object
* @param includeUnicode - true to include unicode in any strings within the json
* @param allowOversize - Allows the json to go over the sizeInBytes limit. If enabled, the
* generated json may be closer to the desired byte size but there is a risk of exceeding the inputted byte limit
* @returns TwitterJson
*/
export function generateTwitterJsonByByteSize(sizeInBytes: number, allowOversize: boolean, seed = 1) {
    const random = makeRandom(seed);
    const textFieldMarkovChain = new SpaceEfficientMarkovChain(random, getTwitterJsonTextFieldMarkovChain());
    const userDescFieldMarkovChain = new SpaceEfficientMarkovChain(random, getTwitterJsonUserDescFieldMarkovChain());
    const basicJapaneseAlphabetString = getBasicJapaneseAlphabetString();
    const twitterJson: TwitterJson = {
        statuses: [],
        search_metadata: {
            completed_in: 0.087,
            max_id: 505874924095815700,
            max_id_str: "505874924095815681",
            next_results: "?max_id=505874847260352512&q=%E4%B8%80&count=100&include_entities=1",
            query: "%E4%B8%80",
            refresh_url: "?since_id=505874924095815681&q=%E4%B8%80&include_entities=1",
            count: 100,
            since_id: 0,
            since_id_str: "0",
        },
    };

    let currentJsonSizeInBytes = getSizeInBytes(twitterJson);
    while (currentJsonSizeInBytes < sizeInBytes) {
        const twitterStatus = generateTwitterStatus(
            "standard", random, textFieldMarkovChain, userDescFieldMarkovChain, basicJapaneseAlphabetString,
        );
        const nextStatusSizeInBytes = getSizeInBytes(twitterStatus);
        if (!allowOversize && currentJsonSizeInBytes + nextStatusSizeInBytes > sizeInBytes) {
            break;
        }
        twitterJson.statuses.push(twitterStatus);
        currentJsonSizeInBytes += nextStatusSizeInBytes;
    }

    return twitterJson;
}

/**
* Generates a TwitterJson object containing exactly the number specified statuses.
* @param numStatuses - number of statuses to include in the generated TwitterJson
* @param includeUnicode - true to include unicode in any strings within the json
* @returns TwitterJson
*/
export function generateTwitterJsonByNumStatuses(numStatuses: number, seed = 1) {
    const random = makeRandom(seed);
    const textFieldMarkovChain = new SpaceEfficientMarkovChain(random, getTwitterJsonTextFieldMarkovChain());
    const userDescFieldMarkovChain = new SpaceEfficientMarkovChain(random, getTwitterJsonUserDescFieldMarkovChain());
    const basicJapaneseAlphabetString = getBasicJapaneseAlphabetString();
    const twitterJson: TwitterJson = {
        statuses: [],
        search_metadata: {
            completed_in: 0.087,
            max_id: 505874924095815700,
            max_id_str: "505874924095815681",
            next_results: "?max_id=505874847260352512&q=%E4%B8%80&count=100&include_entities=1",
            query: "%E4%B8%80",
            refresh_url: "?since_id=505874924095815681&q=%E4%B8%80&include_entities=1",
            count: 100,
            since_id: 0,
            since_id_str: "0",
        },
    };

    for (let i = 0; i < numStatuses; i++) {
        twitterJson.statuses.push(
            generateTwitterStatus(
                "standard", random, textFieldMarkovChain, userDescFieldMarkovChain, basicJapaneseAlphabetString,
            ),
        );
    }

    return twitterJson;
}

/* eslint-disable no-useless-escape */
function generateTwitterStatus(type: "standard" | "retweet", random: IRandom,
    textFieldMarkovChain: SpaceEfficientMarkovChain, userDescFieldMarkovChain: SpaceEfficientMarkovChain,
    alphabet: string) {
    // id is always an 18 digit number
    const statusIdString = getRandomNumberString(random, 18, 18);
    const retweetCount = Math.floor(random.integer(0, 99999));
    const favoriteCount = Math.floor(random.integer(0, 99999));
    const twitterUser = generateTwitterUser(random, userDescFieldMarkovChain, alphabet);
    // The following boolean values mirror the statistical probability of the original json
    const shouldAddHashtagEntity = type === "standard" ? random.bool(0.07) : random.bool(0.027397);
    const shouldAddUrlEntity = type === "standard" ? random.bool(0.12) : random.bool(0.068493);
    const shouldAddUserMentionsEntity = type === "standard" ? random.bool(0.12) : random.bool(0.068493);
    const shouldAddMediaEntity = type === "standard" ? random.bool(0.06) : random.bool(0.0547945);
    const shouldAddInReplyToStatusId = type === "standard" ? random.bool(0.06) : random.bool(0.027397);
    // in reply to screen name & in reply to user id always appear together
    const shouldAddInReplyToUserIdAndScreenName = type === "standard" ? random.bool(0.09) : random.bool(0.041095);

    const twitterStatus: any = {
        metadata: {
            result_type: "recent",
            iso_language_code: "ja",
        },
        created_at: getRandomDateString(random, new Date("2005-01-01"), new Date("2022-01-01")),
        id: Number(statusIdString),
        id_str: `${statusIdString}`,
        text: textFieldMarkovChain.generateSentence(144), // average length the original json text field is 123
        // source can have unicode nested in it
        source: `<a href=\"https://twitter.com/${twitterUser.screen_name}\" rel=\"nofollow\">
         ${random.string(random.integer(2, 30), alphabet)}</a>`,
        truncated: true, // no examples found where truncated was false
        user: twitterUser,
        // could not find an example of non null value for these 4 values (geo, coordinaes, place, contributors)
        geo: null,
        coordinates: null,
        place: null,
        contributors: null,
        possibly_sensitive: random.bool(),
        retweet_count: retweetCount,
        favorite_count: favoriteCount,
        entities: {
            hashtags: [],
            symbols: [],
            urls: [],
            user_mentions: [],
        },
        favorited: retweetCount > 0 ? true : false,
        retweeted: favoriteCount > 0 ? true : false,
        lang: "ja",
    };
    if (type === "standard") {
        const shouldAddRetweet = random.bool(0.73);
        if (shouldAddRetweet) {
            twitterStatus.retweeted_status =
                generateTwitterStatus("retweet", random, textFieldMarkovChain, userDescFieldMarkovChain, alphabet);
        }
    }
    if (shouldAddInReplyToStatusId) {
        const inReplyToStatusId = getRandomNumberString(random, 18, 18);
        twitterStatus.in_reply_to_status_id = inReplyToStatusId !== null ? Number(inReplyToStatusId) : null;
        twitterStatus.in_reply_to_status_id_str = inReplyToStatusId !== null ? inReplyToStatusId : null;
    }
    if (shouldAddInReplyToUserIdAndScreenName) {
        const inReplyToUserId = getRandomNumberString(random, 10, 10);
        twitterStatus.in_reply_to_user_id = inReplyToUserId !== null ? Number(inReplyToUserId) : null;
        twitterStatus.in_reply_to_user_id_str = inReplyToUserId !== null ? inReplyToUserId : null;
        twitterStatus.in_reply_to_screen_name = getRandomEnglishString(random, false, 6, 30);
    }

    if (shouldAddHashtagEntity) {
        twitterStatus.entities.hashtags.push({
            text: random.string(random.integer(2, 30), alphabet),
            indices: [
                Math.floor(random.integer(0, 199)),
                Math.floor(random.integer(0, 199)),
            ],
        });
    }
    if (shouldAddUrlEntity) {
        twitterStatus.entities.urls.push({
            url: "http://t.co/ZkU4TZCGPG",
            expanded_url: "http://www.tepco.co.jp/nu/fukushima-np/review/images/review1_01.gif",
            display_url: "tepco.co.jp/nu/fukushima-n…",
            indices: [
                Math.floor(random.integer(0, 199)),
                Math.floor(random.integer(0, 199)),
            ],
        });
    }
    if (shouldAddUserMentionsEntity) {
        const userId = getRandomNumberString(random, 10, 10);
        twitterStatus.entities.user_mentions.push({
            screen_name: getRandomEnglishString(random, true, 6, 30),
            name: random.string(random.integer(2, 30), alphabet),
            id: Number(userId),
            id_str: userId,
            indices: [
                Math.floor(random.integer(0, 199)),
                Math.floor(random.integer(0, 199)),
            ],
        });
    }
    if (shouldAddMediaEntity) {
        const mediaStatusIdString = getRandomNumberString(random, 18, 18);
        const shouldAddSourceIdData = random.bool();
        const mediaEntity: any = {
            id: Number(mediaStatusIdString),
            id_str: "statusIdString",
            indices: [
                Math.floor(random.integer(0, 199)),
                Math.floor(random.integer(0, 199)),
            ],
            media_url: "http://pbs.twimg.com/media/BwU6g-dCcAALxAW.png",
            media_url_https: "https://pbs.twimg.com/media/BwU6g-dCcAALxAW.png",
            url: "http://t.co/okrAoxSbt0",
            display_url: "pic.twitter.com/okrAoxSbt0",
            expanded_url: "http://twitter.com/waraeru_kan/status/505874871616671744/photo/1",
            type: "photo",
            sizes: {
                small: {
                    w: 340,
                    h: 425,
                    resize: "fit",
                },
                thumb: {
                    w: 150,
                    h: 150,
                    resize: "crop",
                },
                large: {
                    w: 600,
                    h: 750,
                    resize: "fit",
                },
                medium: {
                    w: 600,
                    h: 750,
                    resize: "fit",
                },
            },
        };

        if (shouldAddSourceIdData) {
            mediaEntity.source_status_id_str = getRandomNumberString(random, 18, 18);
            mediaEntity.source_status_id = Number(mediaEntity.source_status_id_str);
        }
        twitterStatus.entities.media = [mediaEntity];
    }

    return twitterStatus as TwitterStatus;
}

function generateTwitterUser(random: IRandom, userDescFieldMarkovChain: SpaceEfficientMarkovChain,
    alphabet: string): TwitterUser {
    const userId = getRandomNumberString(random, 10, 10);
    const shouldAddUrlUrlsEntity = random.bool();
    const shouldAddDescriptionUrlsEntity = random.bool();
    const shouldAddUtcOffsetAndtimezone = random.bool();
    const user: TwitterUser = {
        id: Number(userId),
        id_str: userId,
        name: random.string(random.integer(2, 30), alphabet),
        // screen names do not include unicode characters
        screen_name: getRandomEnglishString(random, false, 6, 30),
        location: "",
        description: userDescFieldMarkovChain.generateSentence(144),
        url: null,
        entities: {
            // This always appears on a user, even if its empty.
            description: {
                urls: [],
            },
        },
        protected: false,
        followers_count: random.integer(0, 9999),
        friends_count: random.integer(0, 9999),
        listed_count: 2,
        created_at: getRandomDateString(random, new Date("2005-01-01"), new Date("2022-01-01")),
        favourites_count: 0,
        utc_offset: shouldAddUtcOffsetAndtimezone ? 32400 : null,
        time_zone: shouldAddUtcOffsetAndtimezone ? "Tokyo" : null,
        geo_enabled: random.bool(),
        verified: random.bool(),
        statuses_count: Math.floor(random.integer(0, 9999)),
        lang: "ja",
        contributors_enabled: random.bool(),
        is_translator: random.bool(),
        is_translation_enabled: random.bool(),
        profile_background_color: getRandomEnglishString(random, true, 6, 6),
        profile_background_image_url: "http://abs.twimg.com/images/themes/theme1/bg.png",
        profile_background_image_url_https: "https://abs.twimg.com/images/themes/theme1/bg.png",
        profile_background_tile: random.bool(),
        profile_image_url: "http://pbs.twimg.com/profile_images/495353473886478336/S-4B_RVl_normal.jpeg",
        profile_image_url_https: "https://pbs.twimg.com/profile_images/495353473886478336/S-4B_RVl_normal.jpeg",
        profile_banner_url: "https://pbs.twimg.com/profile_banners/2699365116/1406936481",
        profile_link_color: getRandomEnglishString(random, true, 6, 6),
        profile_sidebar_border_color: getRandomEnglishString(random, true, 6, 6),
        profile_sidebar_fill_color: getRandomEnglishString(random, true, 6, 6),
        profile_text_color: getRandomEnglishString(random, true, 6, 6),
        profile_use_background_image: random.bool(),
        default_profile: random.bool(),
        default_profile_image: random.bool(),
        following: random.bool(),
        follow_request_sent: random.bool(),
        notifications: random.bool(),
    };
    if (shouldAddUrlUrlsEntity) {
        user.entities.url = {
            urls: [
                {
                    url: "http://t.co/V4oyL0xtZk",
                    expanded_url: "http://astore.amazon.co.jp/furniturewood-22",
                    display_url: "astore.amazon.co.jp/furniturewood-…",
                    indices: [
                        random.integer(0, 199),
                        random.integer(0, 199),
                    ],
                },
            ],
        };
    }
    if (shouldAddDescriptionUrlsEntity) {
        user.entities.description.urls.push(
            {
                url: "http://t.co/8E91tqoeKX",
                expanded_url: "http://ameblo.jp/2no38mae/",
                display_url: "ameblo.jp/2no38mae/",
                indices: [
                    random.integer(0, 199),
                    random.integer(0, 199),
                ],
            },
        );
    }

    return user;
}
/* eslint-enable */

function getBasicJapaneseAlphabetString() {
    // Japanese Hiragana
    return createAlphabetFromUnicodeRange(0x3041, 0x3096) +
        // Japanese Katakana (Full Width)
        createAlphabetFromUnicodeRange(0x30A0, 0x30FF) +
        // Japanese Kanji Alphabet (CJK Unified Ideographs)
        createAlphabetFromUnicodeRange(0x3400, 0x4DB5) +
        createAlphabetFromUnicodeRange(0x4E00, 0x9FCB) +
        createAlphabetFromUnicodeRange(0xF900, 0xFA6A);
}

// This is specifically formatted like the twitter json dates
// (<3-letter-weekday> MMM DD HH:MM:SS <4-digit-TimezoneOffset> YYYY)
function getRandomDateString(random = makeRandom(), start: Date, end: Date) {
    const dateS = new Date(random.integer(+start, +end)).toString();
    return `${dateS.substring(0, 10)} ${dateS.substring(16, 24)} ` +
        `${dateS.substring(28, 33)} ${dateS.substring(11, 15)}`;
}

// Source for unicode ranges:
// https://stackoverflow.com/questions/19899554/
// unicode-range-for-japanese#:~:text=To%20summarize%20the%20ranges%3A,Katakana%20(%2030a0%20%2D%2030ff)
// or more direct source:
// http://www.localizingjapan.com/blog/2012/01/20/regular-expressions-for-japanese-text/
export function isJapanese(ch: string) {
    // Japanese Hiragana
    return (ch >= "\u3041" && ch <= "\u3096"
        // Japanese Katakana (Full Width)
        || ch >= "\u30A0" && ch <= "\u30FF"
        // Japanese Kanji Alphabet (CJK Unified Ideographs)
        || ch >= "\u3400" && ch <= "\u4DB5"
        || ch >= "\u4E00" && ch <= "\u9FCB"
        || ch >= "\uF900" && ch <= "\uFA6A"
        // Kanji Radicals
        || ch >= "\u2E80" && ch <= "\u2FD5"
        // Katakana and Punctuation (Half Width)
        || ch >= "\uFF5F" && ch <= "\uFF9F"
        // Miscellaneous Japanese Symbols and Characters
        || ch >= "\u31F0" && ch <= "\u31FF"
        || ch >= "\u3220" && ch <= "\u3243"
        || ch >= "\u3280" && ch <= "\u337F");
}

export function isAlphaLatin(ch: string) {
    // range 1: ABCDEFGHIJKLMNO0050PQRSTUVWXYZ
    return (ch >= "\u0041" && ch <= "\u005A")
        // range 2: abcdefghijklmnopqrstuvwxyz
        || (ch >= "\u0061" && ch <= "\u007A");
}

export function isSymbol(ch: string) {
    // range 1: !"#$%&'()*+,-./
    return (ch >= "\u0021" && ch <= "\u002F")

        // Range 2: :;<=>?@
        || (ch >= "\u003A" && ch <= "\u0041");
}

export function isEscapeChar(ch: string) {
    return (ch >= "\u0080" && ch <= "\u00A0") || (ch >= "\u0000" && ch <= "\u0010");
}

export function isJapaneseSymbolOrPunctuation(ch: string) {
    return (ch >= "\u3000" && ch <= "\u303F");
}

/**
 * This method creates an array of sentences where a sentence is an array of words. Its intended use is with creating a
 * markovChain. (See the MarkovChain class).
 *
 * Japanese is not space separated but individual characters are counted as words here words.
 * We count a series of english charaters, numbers, symbols or escape characters without spaces in between as a word.
 * 1. we will first space separate the text,
 * 2. we will iterate over each character in each space separated word.
 * 2a. If the char is a Japanese it will be counted as a complete word.
 * 2b. If the characters are alpha latin, escapes or line breaks we will count it as part of a word,
 *  adding each next chars until we get to either a Japanese character or a space.
 */
export function parseSentencesIntoWords(inputSentences: string[]) {
    const outputSentences: string[][] = [];
    inputSentences.forEach((inputSentence) => {
        const sentenceWords: string[] = [];
        const spaceSeparatedWords: string[] = inputSentence.split(" ");
        spaceSeparatedWords.forEach((potentialWord) => {
            const innerWords: string[] = [];
            let previousChar: string | null = null;
            let currentWord = "";
            for (let i = 0; i < potentialWord.length; i++) {
                const currentChar = potentialWord.charAt(i);
                if (isEscapeChar(currentChar) || isJapaneseSymbolOrPunctuation(currentChar)) {
                    if (previousChar && !isEscapeChar(previousChar) || isJapaneseSymbolOrPunctuation(currentChar)) {
                        innerWords.push(`${currentWord}`);
                        currentWord = currentChar;
                    } else {
                        currentWord += currentChar;
                    }
                } else if (isAlphaLatin(currentChar)) {
                    currentWord += currentChar;
                } else if (isJapanese(currentChar)) {
                    if (currentWord.length > 0) {
                        innerWords.push(`${currentWord}`);
                    }
                    innerWords.push(`${currentChar}`);
                    currentWord = "";
                } else {
                    currentWord += currentChar;
                }
                previousChar = currentChar;
            }

            if (currentWord.length > 0) {
                innerWords.push(currentWord);
            }
            innerWords.forEach((word) => sentenceWords.push(word));
        });

        outputSentences.push(sentenceWords);
    });

    return outputSentences;
}

/* eslint-disable max-len, @typescript-eslint/comma-dangle */

// Returns a MarkovChain for prediciting the text field of TwitterJson. The Chain is compatible with the SpaceEfficientMarkovChain Class
export function getTwitterJsonTextFieldMarkovChain() {
    return JSON.parse(
        "{\"1\":{\"日\":2},\"8\":{\"月\":2},\"9\":{\"月\":2,\"三\":1},\"13\":{\"時\":2},\"30\":{\"分\":2},\"31\":{\"日\":3},\"480\":{\"匹\":2},\"500\":{\"メ\":2,\"よ\":1},\"@aym0566x\":{\"\\n\\n\":1},\"MARKOV_SENTENCE_BEGIN_KEY_01$#@%^#\":{\"@aym0566x\":1,\"RT\":73,\"え\":1,\"@longhairxMIURA\":1,\"ラ\":1,\"#LED\":1,\"\":5,\"お\":1,\"@ran_kirazuki\":1,\"@samao21718\":1,\"一\":59,\"あ\":1,\"よ\":2,\"今\":1,\"泉\":1,\"テ\":1,\"@kohecyan3\":1,\"第\":1,\"呼\":1,\"レ\":1,\"す\":1,\"●\":1,\"逢\":1,\"福\":1,\"四\":2,\"@Take3carnifex\":1,\"爆\":1,\"@nasan_arai\":1,\"\\\"\":1,\"闇\":1,\"\\\"@BelloTexto:\":1,\"@kaoritoxx\":1,\"@itsukibot_\":1,\"天\":1,\"@vesperia1985\":1,\"ゴ\":1,\"李\":1},\"\\n\\n\":{\"名\":1,\"お\":2},\"名\":{\"前\":3,\"貪\":2},\"前\":{\":\":2,\"田\":1,\"は\":1,\"へ\":232,\"→\":1,\"日\":2},\":\":{\"前\":1,\"な\":1,\"と\":1,\"ぶ\":1,\"ん\":1,\"照\":1,\"お\":1,\"上\":1,\"う\":1,\"ず\":1,\"過\":1,\"バ\":1,\"あ\":1,\"大\":1,\"\\n\":12,\"\\n#RT\":2,\"\":2,\"￥\":1},\"田\":{\"あ\":1,\"舎\":2,\"新\":2,\"准\":1},\"あ\":{\"ゆ\":1,\"え\":1,\"り\":4,\"ぁ\":1,\"ー\":3,\"る\":116,\"の\":1,\"ふ\":1,\"っ\":1,\"た\":1,\"\":1},\"ゆ\":{\"み\":1},\"み\":{\"\":1,\"合\":1,\"て\":1,\"る\":1,\"た\":2,\"に\":1},\"\":{\"\\n\":23,\"。\":314,\"、\":668,\"「\":13,\"」\":6,\"【\":7,\"】\":8,\"〜（≧∇≦）\":1,\"〜\":1,\"〜(*^^*)！\":1,\"　\":9,\"\\n\\n\":2,\"〜😏🙌\":2,\"〉\":4,\"「……………\":2,\"【H15-9-4\":1,\"。→\":1,\"、１\":2,\"　４\":2,\"　40\":2,\"　http://t.co/lmlgp38fgZ\":2,\"、...\":2,\"\\nhttp://t.co/jRWJt8IrSB\":1,\"。(´\":1,\"〜(´\":1,\"「（\":1,\"\\nhttp://t.co/fXIgRt4ffH\":1,\"\\n(\":1,\"。http://t.co/HLX9mHcQwe\":2},\"\\n\":{\"第\":8,\"今\":8,\"好\":5,\"思\":1,\"ト\":3,\"一\":11,\"漢\":2,\"呼\":8,\"家\":4,\"最\":5,\"光\":1,\"名\":2,\"ち\":1,\"だ\":2,\"　\":8,\"　※\":2,\"ど\":2,\"是\":1,\"先\":1,\"う\":1,\"敵\":1,\"二\":1,\"執\":1,\"闇\":1,\"ハ\":1,\"\\n#\":1},\"第\":{\"一\":21},\"一\":{\"印\":7,\"言\":7,\"生\":2,\"同\":4,\"ラ\":1,\"本\":2,\"文\":2,\"地\":1,\"で\":2,\"関\":1,\"\":5,\"つ\":1,\"に\":116,\"番\":116,\"雨\":2,\"を\":4,\"高\":1,\"踏\":2,\"や\":3,\"三\":1,\"眼\":2,\"科\":1,\"の\":1,\"原\":4,\"场\":2,\"大\":1,\"問\":1,\"答\":1,\"決\":1,\"師\":1,\"流\":1,\"号\":1,\"\\\"No\":6,\"稀\":1,\"水\":1,\"世\":2,\"名\":2},\"印\":{\"象\":14},\"象\":{\":\":8,\"☞\":4,\"台\":2,\"→\":2},\"な\":{\"ん\":117,\"い\":19,\"と\":5,\"😘✨\":1,\"一\":2,\"お\":1,\"っ\":2,\"😳\":2,\"ら\":7,\"！\":1,\"る\":117,\"も\":116,\"\":3,\"俺\":1,\"さ\":1,\"ー\":2,\"交\":1,\"の\":1,\"く\":1,\"情\":1},\"ん\":{\"か\":1,\"ー\":1,\"✋\":1,\"の\":3,\"で\":119,\"家\":2,\"♪\":1,\"\":67,\"\\\\(\":2,\"て\":116,\"ど\":116,\"大\":116,\"に\":2,\"張\":2,\"だ\":3,\"こ\":1,\"天\":1,\"好\":1,\"を\":1,\"ね\":2,\"み\":1},\"か\":{\"怖\":1,\"ら\":8,\"な\":2,\"り\":116,\"も\":58,\"い\":4,\"言\":2,\"わ\":1,\"っ\":3,\"え\":1,\"く\":1,\"風\":1,\"…\":2,\"せ\":1,\"ん\":1},\"怖\":{\"っ\":1},\"っ\":{\"！\":1,\"そ\":2,\"て\":21,\"た\":10,\"ぽ\":2,\"と\":1,\"…\":2},\"！\":{\"\\n\":4,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2,\"http://t.co/FzTyFnt9xH”\":2,\"\\nhttp://t.co…\":1,\"\\nhttp://t.co/9oH5cgpy1q\":1,\"」\":3,\"一\":1,\"命\":1,\"あ\":1,\"毎\":1,\"テ\":1,\"在\":2},\"今\":{\"の\":7,\"こ\":2,\"度\":1,\"日\":2,\"ま\":2,\"天\":2},\"の\":{\"印\":7,\"ダ\":1,\"と\":2,\"ス\":2,\"見\":1,\"DVD\":1,\"よ\":1,\"雨\":1,\"足\":1,\"指\":2,\"第\":1,\"年\":116,\"を\":116,\"で\":117,\"は\":116,\"場\":116,\"…\":58,\"か\":58,\"カ\":60,\"申\":2,\"再\":2,\"皆\":2,\"た\":2,\"\":1,\"時\":1,\"自\":1,\"？\":1,\"調\":1,\"キ\":1,\"こ\":1,\"区\":1,\"拓\":1,\"際\":1,\"妨\":2,\"方\":2,\"ラ\":3,\"NHK-FM\":1,\"秘\":2,\"敷\":1,\"排\":1,\"構\":2,\"ツ\":1,\"甘\":1,\"セ\":1,\"ア\":1,\"称\":1,\"剣\":1,\"師\":1,\"武\":1,\"差\":1,\"生\":1,\"俺\":1,\"ソ\":1,\"標\":2,\"０\":1,\"ゼ\":1,\"新\":1,\"商\":1,\"現\":1},\"と\":{\"り\":1,\"こ\":8,\"な\":4,\"い\":350,\"小\":1,\"は\":2,\"う\":3,\"書\":116,\"\":116,\"と\":116,\"祈\":2,\"三\":1,\"か\":4,\"し\":2,\"思\":2,\"や\":1,\"女\":1,\"に\":1,\"生\":1,\"FB\":1,\"付\":1,\"る\":1,\"九\":1},\"り\":{\"あ\":2,\"す\":1,\"で\":2,\"と\":2,\"ま\":117,\"急\":116,\"に\":116,\"が\":2,\"を\":4,\"会\":1,\"の\":1,\"\":3,\"だ\":1,\"締\":1,\"り\":1},\"え\":{\"ず\":1,\"っ\":2,\"な\":4,\"た\":1,\"て\":2,\"続\":2,\"ば\":2,\"の\":1,\"る\":1},\"ず\":{\"キ\":1,\"バ\":2,\"る\":1},\"キ\":{\"モ\":2,\"ー\":2,\"ャ\":2,\"ン\":1,\"ブ\":2},\"モ\":{\"い\":2},\"い\":{\"\":9,\"と\":119,\"出\":1,\"田\":2,\"続\":2,\"け\":2,\"←\":2,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":4,\"ま\":9,\"た\":1,\"！！\":2,\"て\":237,\"ー\":2,\"…\":1,\"ね\":1,\"い\":4,\"な\":1,\"う\":348,\"る\":121,\"く\":116,\"こ\":116,\"体\":4,\"か\":4,\"す\":2,\"し\":2,\"つ\":2,\"ん\":2,\"が\":1,\"夢\":1,\"）\":1,\"手\":1,\"！\":1,\"ら\":1,\"優\":3,\"で\":1,\"ろ\":2,\"事\":1,\"っ\":2},\"。\":{\"噛\":1,\"人\":116,\"本\":116,\"by\":58,\"今\":2,\"全\":2,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":6,\"魔\":1,\"」\":2,\"\\nhttp://t.co/ZkU4TZCGPG\":2,\"\\nRT\":2,\"明\":2,\"预\":2,\"イ\":1,\"\\n\":1,\"愛\":1,\"い\":1},\"噛\":{\"み\":1},\"合\":{\"わ\":1,\"唱\":1,\"（\":2,\"う\":1},\"わ\":{\"な\":1,\"\":1,\"ろ\":1,\"り\":1},\"好\":{\"き\":6,\"ん\":1,\"\":1},\"き\":{\"な\":6,\"る\":2,\"止\":2,\"て\":117,\"去\":116,\"そ\":2,\"た\":2,\"\":1,\"合\":1},\"こ\":{\"ろ\":7,\"😋✨✨\":1,\"と\":122,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2,\"こ\":2,\"の\":119,\"盛\":1,\"ち\":2},\"ろ\":{\":\":4,\"し\":3,\"ま\":2,\"一\":2,\"た\":1,\"→\":1,\"い\":1,\"壁\":1,\"う\":1},\"ぶ\":{\"す\":1,\"ん\":2},\"す\":{\"で\":1,\"ぎ\":1,\"が\":3,\"ん\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"る\":10,\"！“@8CBR8:\":2,\"！\":5,\"ア\":1,\"ご\":1,\"…\":1,\"よ\":1},\"で\":{\"500\":2,\"キ\":3,\"き\":3,\"帰\":2,\"行\":2,\"U\":2,\"進\":2,\"届\":1,\"い\":2,\"は\":2,\"知\":116,\"し\":232,\"す\":4,\"\":6,\"柏\":2,\"も\":4,\"面\":1,\"あ\":1,\"ね\":1,\"な\":1},\"😋✨✨\":{\"\\n\":1},\"思\":{\"い\":1,\"っ\":2,\"う\":1},\"出\":{\":\":1,\"→\":2,\"来\":4,\"を\":2},\"ー\":{\"ー\":2,\"\":3,\"ト\":5,\"ン\":2,\"ス\":4,\"ち\":2,\"な\":2,\"今\":1,\"摂\":2,\"プ\":2,\"ル\":2,\"バ\":1,\"の\":1,\"さ\":2,\"ド\":2,\"\\\"\":1,\"セ\":1,\"ジ\":1,\"！\":1,\"ム\":1},\"、\":{\"あ\":1,\"誠\":1,\"常\":1,\"美\":1,\"正\":116,\"こ\":116,\"前\":116,\"ど\":116,\"一\":116,\"夏\":58,\"無\":2,\"東\":2,\"再\":2,\"も\":2,\"お\":2,\"そ\":2,\"「\":2,\"笑\":1,\"学\":1,\"拓\":1,\"建\":1,\"通\":1,\"四\":2,\"な\":1,\"、\":2,\"\\n\":1,\"三\":1,\"井\":1,\"ア\":1},\"ぎ\":{\"😊❤️\":1},\"😊❤️\":{\"\\nLINE\":1},\"\\nLINE\":{\"交\":4},\"交\":{\"換\":4,\"際\":1},\"換\":{\"で\":2,\"☞\":2},\"る\":{\"？:\":1,\"(1\":2,\"狂\":2,\"と\":233,\"ん\":2,\"な\":4,\"ま\":116,\"の\":116,\"こ\":3,\"国\":4,\"意\":2,\"量\":2,\"か\":2,\"\":7,\"笑\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2,\"ww\":2,\"★\":4,\"→\":4,\"利\":1,\"私\":1,\"人\":1,\"一\":2,\"？→\":1,\"(\":1,\"）\":1,\"気\":1,\"(°_°)！\":1,\"ほ\":1,\"も\":1,\"音\":1,\":\":1,\"正\":1},\"？:\":{\"あ\":1},\"ぁ\":{\"……\":1,\"ぼ\":1},\"……\":{\"ご\":1},\"ご\":{\"め\":1,\"ざ\":4,\"ろ\":2,\"く\":1},\"め\":{\"ん\":1,\"る\":4,\"奉\":1,\"の\":116,\"に\":2,\"ら\":2},\"✋\":{\"\\n\":1},\"ト\":{\"プ\":3,\"ル\":4,\"の\":2,\"に\":1,\"\":3,\"フ\":1},\"プ\":{\"画\":3,\"し\":2},\"画\":{\"を\":1,\"に\":2,\"\":2,\"パ\":1},\"を\":{\"み\":1,\"収\":2,\"頂\":1,\"持\":2,\"崇\":1,\"好\":1,\"置\":116,\"踊\":4,\"容\":2,\"抑\":2,\"お\":2,\"送\":2,\"食\":2,\"選\":4,\"利\":1,\"求\":1,\"認\":1,\"感\":1,\"泣\":1,\"ペ\":1,\"見\":1},\"て\":{\"480\":2,\":\":1,\"っ\":2,\"言\":2,\"帰\":2,\"迷\":2,\"姉\":1,\"る\":5,\"☞\":2,\"\":353,\"い\":238,\"ま\":2,\"き\":3,\"下\":3,\"て\":3,\"大\":2,\"み\":2,\"寝\":2,\"く\":1,\"（\":1,\"た\":1,\"ん\":1,\"道\":1,\"も\":2,\"歳\":1,\"お\":1,\"は\":1},\"照\":{\"れ\":1},\"れ\":{\"ま\":59,\"は\":5,\"方\":5,\"た\":4,\"が\":2,\"か\":1,\"な\":2,\"で\":2,\"て\":2,\"し\":2,\"い\":1,\"る\":2},\"ま\":{\"す\":10,\"り\":2,\"で\":121,\"な\":2,\"お\":2,\"る\":116,\"せ\":176,\"だ\":2,\"ま\":2,\"さ\":2,\"し\":1,\"ろ\":1,\"職\":1},\"が\":{\"な\":2,\"家\":2,\"つ\":1,\"朝\":1,\"と\":2,\"\":2,\"ダ\":2,\"普\":2,\"絶\":1,\"北\":1,\"あ\":2,\"い\":1,\"開\":1,\"連\":1,\"人\":1,\"…！\":2,\"こ\":2,\"取\":1,\"す\":1},\"😘✨\":{\"\\n\":1},\"言\":{\":\":4,\"う\":2,\"葉\":1,\"☞\":2,\"っ\":2,\"→\":1},\"お\":{\"前\":1,\"ろ\":2,\"は\":2,\"言\":1,\"ち\":2,\"と\":2,\"ね\":2,\"願\":4,\"腹\":2,\"い\":1,\"る\":1},\"は\":{\"一\":4,\"・\":2,\"よ\":2,\"……！\":1,\"な\":1,\"生\":116,\"\":119,\"ま\":2,\"1900kcal\":2,\"い\":5,\"満\":1,\"普\":2,\"反\":1,\"で\":1,\"大\":1,\"僕\":1,\"そ\":1,\"デ\":1},\"生\":{\"も\":1,\"き\":116,\"开\":2,\"の\":1,\"徒\":2,\"来\":1},\"も\":{\"ん\":2,\"行\":2,\"っ\":2,\"の\":232,\"し\":58,\"う\":2,\"ど\":2,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"\":2,\"話\":1,\"尊\":1,\"い\":1},\"ダ\":{\"チ\":1,\"イ\":2},\"チ\":{\"💖\":1,\"に\":2},\"💖\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"RT\":{\"@KATANA77:\":1,\"@omo_kko:\":1,\"@thsc782_407:\":1,\"@AFmbsk:\":1,\"@shiawaseomamori:\":58,\"@POTENZA_SUPERGT:\":1,\"@UARROW_Y:\":2,\"@assam_house:\":1,\"@Takashi_Shiina:\":1,\"@naopisu_:\":1,\"@oen_yakyu:\":1,\"@Ang_Angel73:\":1,\"@takuramix:\":1,\"@siranuga_hotoke:\":1,\"@fightcensorship:\":1},\"@KATANA77:\":{\"え\":1},\"そ\":{\"れ\":7,\"の\":1,\"う\":7,\"わ\":1},\"・\":{\"・\":4,\"（\":2,\"θ\":1,\"）\":1,\"デ\":1,\"K20D\":1},\"（\":{\"一\":2,\"・\":1,\"別\":1,\"中\":2,\"永\":1},\"同\":{\"）\":2,\"意\":2,\"\":2},\"）\":{\"http://t.co/PkCJAcSuYK\":2,\"\\n\":1,\"ク\":1,\"」\":1,\"　\":1},\"http://t.co/PkCJAcSuYK\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2},\"@longhairxMIURA\":{\"朝\":1},\"朝\":{\"一\":3},\"ラ\":{\"イ\":1,\"ウ\":2,\"の\":1,\"・\":1,\"ス\":1,\"ジ\":5,\"…\":1,\"ち\":1,\"ン\":1},\"イ\":{\"カ\":1,\"エ\":2,\"チ\":2,\"ケ\":1,\"ト\":1,\"ズ\":1,\"デ\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"リ\":1},\"カ\":{\"ス\":1,\"ツ\":4,\"ル\":58,\"ロ\":2,\"メ\":1,\"ミ\":1,\"イ\":1},\"ス\":{\"辛\":1,\"ペ\":2,\"に\":2,\"テ\":2,\"\":2,\"完\":2,\"・\":1,\"メ\":1,\"を\":1,\"タ\":3,\"ク\":1,\"ト\":2},\"辛\":{\"目\":1},\"目\":{\"だ\":1,\"が\":2},\"だ\":{\"よ\":3,\"な\":116,\"け\":2,\"与\":2,\"！\":2,\"れ\":2,\"っ\":1,\"と\":1},\"よ\":{\"w\":1,\"う\":9,\"\":1,\"！\":1,\"ね\":1,\"ー\":1,\"…！！\":1,\"り\":1},\"w\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@omo_kko:\":{\"ラ\":1},\"ウ\":{\"ワ\":2,\"ス\":2,\"ィ\":1,\"ズ\":1},\"ワ\":{\"ン\":2},\"ン\":{\"脱\":2,\"出\":2,\"ボ\":2,\"で\":1,\"タ\":1,\"ク\":2,\"ス\":1,\"ド\":2,\"と\":1,\"ち\":2,\"フ\":1},\"脱\":{\"出\":2},\"→\":{\"友\":2,\"墓\":2,\"大\":4,\"な\":2,\"誰\":1,\"れ\":1,\"可\":1},\"友\":{\"達\":6},\"達\":{\"が\":2,\"ん\":2,\"お\":2},\"家\":{\"に\":4,\"族\":4},\"に\":{\"連\":2,\"乗\":2,\"\":4,\"つ\":3,\"す\":4,\"一\":6,\"身\":1,\"し\":119,\"止\":116,\"な\":117,\"正\":116,\"あ\":116,\"会\":1,\"必\":4,\"私\":2,\"行\":2,\"や\":5,\"陸\":1,\"ヨ\":1,\"取\":1,\"か\":1,\"基\":1,\"対\":1,\"関\":2,\"受\":1,\"当\":1,\"も\":1,\"い\":1,\"平\":2},\"連\":{\"ん\":2,\"れ\":1},\"帰\":{\"っ\":2,\"る\":2},\"う\":{\"か\":6,\"ご\":4,\"な\":1,\"で\":4,\"意\":116,\"気\":116,\"\":116,\"の\":116,\"一\":2,\"と\":2,\"え\":1,\"ぞ\":2,\"見\":2,\"ち\":1,\"ど\":1,\"に\":2,\"じ\":1,\"よ\":2,\"思\":1,\"だ\":1},\"ら\":{\"友\":2,\"い\":3,\"？！\":2,\"☞\":2,\"な\":1,\"れ\":5,\"人\":2,\"２\":1,\"し\":1,\":\":2,\"や\":2,\"じ\":8,\"\":2,\"♡\":1,\"も\":1,\"シ\":1,\"×\":1},\"乗\":{\"せ\":2},\"せ\":{\"て\":2,\"ん\":176,\"ら\":2,\"た\":1,\"焼\":1},\"(1\":{\"度\":2},\"度\":{\"も\":2,\"会\":1},\"行\":{\"っ\":4,\"き\":2,\"妨\":1,\"為\":1,\"部\":1},\"た\":{\"こ\":2,\"\":121,\"ら\":3,\"だ\":2,\"知\":2,\"め\":2,\"の\":1,\"人\":4,\"www\":1,\"(\":1,\"り\":3,\"実\":1,\"楽\":1,\"赤\":1,\"い\":1,\"っ\":1,\"ん\":1,\"し\":1,\"？？\":1},\"舎\":{\"道\":2},\"道\":{\")→\":2,\"進\":2,\"路\":2,\"の\":1},\")→\":{\"友\":2},\"し\":{\"て\":128,\"そ\":2,\"い\":238,\"た\":121,\"ょ\":116,\"れ\":58,\"ま\":2,\"よ\":2,\"か\":1,\"右\":2,\"\":1,\"隊\":1,\"は\":1},\"迷\":{\"子\":2},\"子\":{\"→500\":2,\"で\":1,\"や\":1,\"\":2},\"→500\":{\"メ\":2},\"メ\":{\"ー\":4,\"ン\":1,\"ラ\":1,\"イ\":1,\"面\":1,\"の\":1,\"る\":1},\"ル\":{\"く\":2,\"元\":2,\"テ\":58,\"\":1,\"一\":1,\"が\":1,\"#\":1},\"く\":{\"ら\":2,\"変\":2,\"も\":116,\"て\":4,\"そ\":1,\"面\":1,\"っ\":2},\"続\":{\"く\":2,\"け\":2,\"試\":2},\"変\":{\"な\":2,\"！\":1},\"本\":{\"道\":2,\"当\":116},\"進\":{\"む\":2,\"ま\":2},\"む\":{\"→\":2},\"墓\":{\"地\":2},\"地\":{\"で\":2,\"区\":1,\"所\":1,\"図\":2,\"江\":2,\"将\":4,\"东\":2,\"今\":2},\"止\":{\"ま\":118},\"U\":{\"タ\":2},\"タ\":{\"ー\":4,\"ッ\":1,\"ル\":1,\"リ\":1,\"エ\":1},\"来\":{\"ず\":2,\"る\":2,\"一\":2,\"な\":1},\"バ\":{\"ッ\":2,\"ー\":1,\"リ\":1},\"ッ\":{\"ク\":3,\"ト\":3,\"ド\":1},\"ク\":{\"で\":2,\"リ\":1,\"ス\":1,\"ラ\":1,\"ー\":1,\"所\":1,\"に\":1},\"元\":{\"の\":2,\"に\":1},\"け\":{\"な\":2,\"が\":1,\"る\":1,\"で\":2,\"て\":2,\"た\":1,\"と\":1,\"！！w\":1},\"←\":{\"今\":2},\"@thsc782_407:\":{\"#LED\":1},\"#LED\":{\"カ\":2},\"ツ\":{\"カ\":2,\"選\":2,\"メ\":2},\"選\":{\"手\":2,\"択\":4},\"手\":{\"権\":2,\"元\":1},\"権\":{\"\":2,\"利\":1},\"漢\":{\"字\":2},\"字\":{\"一\":2,\"ぶ\":2},\"文\":{\"字\":2},\"ペ\":{\"ー\":2,\"ン\":1,\"ロ\":2},\"「\":{\"ハ\":2,\"同\":2,\"成\":2,\"そ\":2,\"く\":2,\"ソ\":1,\"剣\":1,\"リ\":3,\"不\":1},\"ハ\":{\"ウ\":2,\"リ\":1},\"テ\":{\"ン\":2,\"\":58,\"レ\":2,\"ィ\":1},\"ボ\":{\"ス\":2},\"」\":{\"を\":2,\"は\":2,\"と\":4,\"\\n\":6,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":3,\"の\":2},\"収\":{\"め\":2},\"狂\":{\"気\":2},\"気\":{\"http://t.co/vmrreDMziI\":2,\"持\":116,\"が\":1},\"http://t.co/vmrreDMziI\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2},\"【\":{\"金\":1,\"状\":1,\"大\":2,\"映\":1,\"マ\":1,\"彩\":1,\"反\":1},\"金\":{\"一\":1},\"区\":{\"太\":1,\"別\":1},\"太\":{\"鼓\":1,\"郎\":1},\"鼓\":{\"台\":1},\"台\":{\"\":1,\"消\":2},\"】\":{\"川\":1,\"ペ\":1,\"道\":1,\"　\":3,\"【\":1,\"妖\":1,\"http://t.co/PjL9if8OZC\":1},\"川\":{\"関\":1,\"草\":58,\"の\":2,\"盆\":4,\"光\":1,\"一\":1},\"関\":{\"と\":1,\"節\":1,\"わ\":1,\"す\":1},\"小\":{\"山\":1,\"学\":2,\"川\":1},\"山\":{\"の\":1,\"崎\":1},\"見\":{\"分\":1,\"英\":4,\"を\":2,\"た\":1,\"て\":2,\"る\":1},\"分\":{\"け\":1,\"～\":2},\"つ\":{\"か\":1,\"い\":3,\"簡\":1,\"天\":2,\"剣\":1},\"ざ\":{\"い\":4},\"♪\":{\"SSDS\":1},\"SSDS\":{\"の\":1},\"DVD\":{\"が\":1},\"届\":{\"い\":1},\"〜（≧∇≦）\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@ran_kirazuki\":{\"そ\":1},\"葉\":{\"を\":1},\"頂\":{\"け\":1},\"……！\":{\"こ\":1},\"雨\":{\"太\":1,\"き\":2,\"开\":2,\":\":2,\"或\":2,\"天\":2},\"郎\":{\"\":1},\"誠\":{\"心\":1,\"意\":1},\"心\":{\"誠\":1},\"意\":{\"を\":1,\"味\":116,\"\":2,\"見\":2},\"持\":{\"っ\":1,\"ち\":116,\"者\":1,\"つ\":1},\"姉\":{\"御\":1},\"御\":{\"の\":1},\"足\":{\"の\":1},\"指\":{\"の\":1,\"定\":1},\"節\":{\"を\":1},\"崇\":{\"め\":1,\"徳\":4},\"奉\":{\"り\":1},\"@AFmbsk:\":{\"@samao21718\":1},\"@samao21718\":{\"\\n\":2},\"呼\":{\"び\":5,\"ば\":5},\"び\":{\"方\":5},\"方\":{\"☞\":4,\":\":6,\"は\":2,\"か\":1},\"☞\":{\"ま\":2,\"あ\":2,\"平\":2,\"お\":4,\"も\":2,\"楽\":2,\"全\":2},\"ち\":{\"ゃ\":10,\"ば\":116,\"ょ\":1,\"ら\":2,\"に\":1},\"ゃ\":{\"ん\":10,\"な\":1},\"ば\":{\"れ\":5,\"か\":116,\"い\":2},\"平\":{\"野\":2,\"\":1,\"均\":2},\"野\":{\"か\":2,\"滉\":1},\"？！\":{\"\\n\":2},\"ぽ\":{\"い\":2},\"！！\":{\"\\nLINE\":2,\"\\n\":1},\"\\\\(\":{\"ˆoˆ\":2},\"ˆoˆ\":{\")/\":2},\")/\":{\"\\n\":2},\"楽\":{\"し\":3},\"😳\":{\"\\n\":2},\"族\":{\"に\":4},\"ね\":{\"ぇ\":2,\"ー\":1,\"(´\":1,\"！\":3,\"♡\":1},\"ぇ\":{\"ち\":2},\"最\":{\"後\":5},\"後\":{\"に\":5},\"全\":{\"然\":2,\"車\":2,\"国\":2},\"然\":{\"会\":2},\"会\":{\"え\":4,\"場\":1,\"長\":1},\"…\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":60,\"僕\":2,\"」\":3},\"常\":{\"に\":1},\"身\":{\"一\":1},\"簡\":{\"素\":1},\"素\":{\"に\":1},\"美\":{\"食\":1},\"食\":{\"を\":1,\"え\":2},\"@shiawaseomamori:\":{\"一\":58},\"書\":{\"い\":116,\"提\":2},\"正\":{\"し\":232,\"式\":1},\"味\":{\"だ\":116,\"方\":1},\"年\":{\"に\":116,\"08\":1,\"運\":2},\"知\":{\"り\":116,\"事\":4},\"人\":{\"は\":118,\"男\":2,\"に\":4,\"質\":1,\"格\":1,\"\":1},\"へ\":{\"前\":116,\"と\":116,\"移\":1},\"急\":{\"い\":116},\"ど\":{\"ん\":233,\"う\":4,\"ね\":1},\"大\":{\"切\":116,\"盛\":2,\"学\":1,\"阪\":4,\"拡\":2,\"暴\":2,\"変\":1,\"事\":1},\"切\":{\"な\":116},\"置\":{\"き\":116},\"去\":{\"り\":116},\"ょ\":{\"う\":116,\"っ\":1},\"当\":{\"に\":116,\"た\":1},\"番\":{\"初\":116},\"初\":{\"め\":116},\"場\":{\"所\":116,\"入\":1,\"お\":1,\"一\":1},\"所\":{\"に\":116,\"有\":1,\"持\":1},\"by\":{\"神\":58},\"神\":{\"様\":58,\"奈\":2},\"様\":{\"の\":58,\"\":2},\"夏\":{\"川\":58},\"草\":{\"介\":58},\"介\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":58},\"@POTENZA_SUPERGT:\":{\"あ\":1},\"！“@8CBR8:\":{\"@POTENZA_SUPERGT\":2},\"@POTENZA_SUPERGT\":{\"13\":2},\"時\":{\"30\":2,\"半\":2,\"計\":1,\"～\":2},\"半\":{\"ご\":2},\"無\":{\"事\":2},\"事\":{\"全\":2,\"は\":2,\"に\":2,\"！\":1,\"し\":1},\"車\":{\"決\":2},\"決\":{\"勝\":4,\"定\":1},\"勝\":{\"レ\":2,\"戦\":2},\"レ\":{\"ー\":3,\"ビ\":2,\"ッ\":2,\"フ\":2},\"完\":{\"走\":2},\"走\":{\"出\":2},\"祈\":{\"っ\":2},\"http://t.co/FzTyFnt9xH”\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2},\"@UARROW_Y:\":{\"よ\":2},\"体\":{\"操\":5},\"操\":{\"第\":5},\"踊\":{\"る\":4,\"っ\":1},\"国\":{\"見\":4,\"の\":2},\"英\":{\"http://t.co/SXoYWH98as\":4},\"http://t.co/SXoYWH98as\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":4},\"日\":{\"は\":1,\"20:47:53\":1,\"多\":2,\"电\":2,\")\":2,\"，\":2,\"子\":2,\"ま\":1,\"一\":1,\"南\":2},\"高\":{\"と\":1,\"校\":2},\"三\":{\"桜\":1,\"軍\":1,\"浦\":3,\"重\":1},\"桜\":{\"（\":1},\"θ\":{\"・\":1},\"光\":{\"梨\":1,\")-\":1,\"筆\":2},\"梨\":{\"ち\":1},\"〜\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@assam_house:\":{\"泉\":1},\"泉\":{\"田\":2},\"新\":{\"潟\":2,\"网\":2,\"品\":1},\"潟\":{\"県\":2},\"県\":{\"知\":2},\"東\":{\"電\":2,\"宝\":1},\"電\":{\"の\":2},\"申\":{\"請\":2},\"請\":{\"書\":2},\"提\":{\"出\":2},\"容\":{\"認\":2},\"認\":{\"さ\":2,\"め\":1},\"さ\":{\"せ\":2,\"い\":3,\"に\":2,\"\":1,\"れ\":4,\"と\":1,\"ん\":2},\"再\":{\"稼\":4},\"稼\":{\"働\":4},\"働\":{\"に\":2,\"を\":2},\"必\":{\"要\":2,\"死\":2},\"要\":{\"な\":2},\"与\":{\"え\":2},\"柏\":{\"崎\":2},\"崎\":{\"刈\":2,\"貴\":1},\"刈\":{\"羽\":2},\"羽\":{\"の\":2},\"抑\":{\"え\":2},\"踏\":{\"ん\":2},\"張\":{\"り\":2},\"願\":{\"い\":4},\"送\":{\"っ\":2,\"局\":4},\"下\":{\"さ\":3,\"一\":1},\"皆\":{\"様\":2},\"\\nhttp://t.co…\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"\\nhttp://t.co/9oH5cgpy1q\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@Takashi_Shiina:\":{\"テ\":1},\"ビ\":{\"で\":2},\"成\":{\"人\":2},\"男\":{\"性\":2},\"性\":{\"の\":2},\"ロ\":{\"リ\":2,\"ペ\":1,\"す\":1,\"）\":1},\"リ\":{\"ー\":3,\"フ\":1,\"ス\":2,\"ン\":3,\"ポ\":1,\"ア\":1,\"は\":2},\"摂\":{\"取\":2},\"取\":{\"量\":2,\"ら\":1,\"り\":1},\"量\":{\"は\":2,\"で\":2},\"1900kcal\":{\"」\":2},\"私\":{\"が\":2,\"道\":1},\"エ\":{\"ッ\":2,\"リ\":1},\"死\":{\"で\":2},\"普\":{\"通\":4},\"通\":{\"な\":2,\"っ\":1,\"の\":2,\"行\":1},\"天\":{\"9\":2,\"一\":2,\"(31\":2,\"气\":2,\"，\":2,\"下\":1,\"冥\":2},\"や\":{\"コ\":2,\"る\":6,\"っ\":1,\"赤\":1,\"ま\":1,\"け\":1},\"コ\":{\"コ\":2,\"イ\":2,\"ン\":1},\"盛\":{\"り\":3},\"@kohecyan3\":{\"\\n\":1},\"上\":{\"野\":1,\"真\":1,\"一\":2},\"滉\":{\"平\":1},\"過\":{\"剰\":1},\"剰\":{\"な\":1},\"俺\":{\"イ\":1,\"の\":1},\"ケ\":{\"メ\":1},\"ア\":{\"ピ\":1,\"ツ\":1,\"ナ\":1,\"ス\":1,\"の\":1,\"ラ\":1,\"は\":1,\"ー\":1},\"ピ\":{\"ー\":1},\"計\":{\"\":1},\"自\":{\"信\":1},\"信\":{\"さ\":1},\"笑\":{\"い\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2,\"ｗｗ\":1},\"絶\":{\"え\":1},\"学\":{\"受\":1,\"校\":1,\"日\":2,\"生\":2,\"的\":2},\"受\":{\"か\":1,\"け\":1,\"診\":1},\"？\":{\"応\":1},\"応\":{\"援\":1},\"援\":{\"し\":1},\"〜(*^^*)！\":{\"\\n\\n#RT\":1},\"\\n\\n#RT\":{\"し\":1},\"軍\":{\"か\":1,\"兵\":1},\"２\":{\"個\":1},\"個\":{\"師\":1},\"師\":{\"団\":2,\"匠\":1},\"団\":{\"が\":1,\"団\":1,\"長\":1},\"北\":{\"へ\":1,\"部\":2},\"移\":{\"動\":1},\"動\":{\"中\":1,\"画\":2,\"員\":2},\"中\":{\"ら\":1,\"京\":4,\"継\":4,\"新\":2,\"央\":2,\"小\":2,\"部\":2,\"古\":1,\"國\":2},\"　\":{\"　\":6,\"こ\":1,\"〈\":4,\"ら\":4,\"福\":2,\"爆\":2,\"中\":2,\"永\":1,\"監\":1,\"山\":1,\"キ\":1,\"岡\":1,\"踊\":1},\"調\":{\"子\":1},\"満\":{\"州\":1,\"喫\":1},\"州\":{\"に\":1},\"陸\":{\"軍\":1},\"兵\":{\"力\":1},\"力\":{\"が\":1},\"ふ\":{\"れ\":1,\"ぁ\":1},\"@naopisu_:\":{\"呼\":1},\"\\n#RT\":{\"し\":2},\"腹\":{\"痛\":2},\"痛\":{\"く\":2},\"寝\":{\"れ\":2},\"ww\":{\"\\n\":2},\"ぞ\":{\"\":2},\"〜😏🙌\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2},\"ド\":{\"ク\":1,\"ウ\":1,\"マ\":2,\"ル\":1},\"フ\":{\"の\":1,\"カ\":1,\"http://t.co/PcSaXzfHMW\":1,\"レ\":2},\"ャ\":{\"ラ\":1,\"ス\":1},\"女\":{\"装\":1},\"装\":{\"っ\":1},\"www\":{\"朝\":1},\"面\":{\"白\":2,\"子\":1},\"白\":{\"か\":1,\"い\":1},\"(\":{\"˘ω゜)\":1,\"三\":2,\"｢\":1},\"˘ω゜)\":{\"笑\":1},\"状\":{\"態\":1},\"態\":{\"良\":1},\"良\":{\"好\":1},\"デ\":{\"ジ\":1,\"ア\":1,\"カ\":1},\"ジ\":{\"タ\":1,\"オ\":5,\"を\":1},\"眼\":{\"レ\":2},\"K20D\":{\"入\":1},\"入\":{\"札\":1,\"り\":1},\"札\":{\"数\":1},\"数\":{\"=38\":1},\"=38\":{\"現\":1},\"現\":{\"在\":2,\"場\":1},\"在\":{\"価\":1,\"の\":1,\"前\":2},\"価\":{\"格\":1},\"格\":{\"=15000\":1,\"的\":1},\"=15000\":{\"円\":1},\"円\":{\"http://t.co/4WK1f6V2n6\":1},\"http://t.co/4WK1f6V2n6\":{\"終\":1},\"終\":{\"了\":1},\"了\":{\"=2014\":1,\"！\":2},\"=2014\":{\"年\":1},\"08\":{\"月\":1},\"月\":{\"1\":2,\"31\":3,\"と\":1,\"恐\":1},\"20:47:53\":{\"#\":1},\"#\":{\"一\":1,\"天\":1},\"http://t.co/PcSaXzfHMW\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"夢\":{\"見\":1},\"魔\":{\"法\":1},\"法\":{\"科\":1,\"に\":1},\"科\":{\"高\":1,\"二\":1,\"の\":1},\"校\":{\"通\":1,\"対\":1,\"の\":1,\"竹\":1},\"別\":{\"に\":1,\"な\":1},\"二\":{\"科\":1,\"号\":1},\"ヨ\":{\"セ\":1},\"セ\":{\"ア\":1,\"ン\":1,\"ー\":1},\"赤\":{\"僕\":2},\"僕\":{\"の\":3,\"読\":1,\"が\":1},\"拓\":{\"也\":2},\"也\":{\"が\":2},\"対\":{\"抗\":1,\"崇\":2,\"中\":2,\"し\":1},\"抗\":{\"合\":1},\"唱\":{\"コ\":1},\"開\":{\"催\":1},\"催\":{\"さ\":1},\"際\":{\"他\":1,\"は\":1},\"他\":{\"校\":1},\"妨\":{\"害\":3},\"害\":{\"工\":1,\"行\":1,\"と\":1},\"工\":{\"作\":1},\"作\":{\"受\":1},\"実\":{\"が\":1},\"質\":{\"に\":1},\"読\":{\"み\":1},\"@oen_yakyu:\":{\"●\":1},\"●\":{\"継\":2},\"継\":{\"続\":2,\"\":4},\"試\":{\"合\":2},\"京\":{\"対\":2,\"or\":2,\"青\":2},\"徳\":{\"）46\":2,\")\":2},\"）46\":{\"回\":2},\"回\":{\"～\":2,\"そ\":1},\"～\":{\"　9\":2,\"\\n\":4,\"\":2},\"　9\":{\"時\":2},\"〈\":{\"ラ\":4},\"オ\":{\"中\":4,\"の\":1},\"〉\":{\"\\n\":4},\"じ\":{\"る\":9,\"ゃ\":1},\"★\":{\"ら\":4},\"阪\":{\"放\":4},\"放\":{\"送\":4},\"局\":{\"を\":4},\"択\":{\"→NHK-FM\":2,\"→NHK\":2},\"→NHK-FM\":{\"\\n●\":2},\"\\n●\":{\"決\":2},\"戦\":{\"(\":2,\"ウ\":1},\"浦\":{\"対\":2,\"春\":1},\"or\":{\"崇\":2},\")\":{\"　12\":2,\"又\":2,\"｢\":1},\"　12\":{\"時\":2},\"→NHK\":{\"第\":2},\"　※\":{\"神\":2},\"奈\":{\"川\":2},\"NHK-FM\":{\"で\":1},\"@Ang_Angel73:\":{\"逢\":1},\"逢\":{\"坂\":2},\"坂\":{\"\":2},\"秘\":{\"め\":2},\"右\":{\"目\":2},\"…！\":{\"」\":2},\"「……………\":{\"。\":2},\"【H15-9-4\":{\"】\":1},\"路\":{\"を\":1,\"一\":1},\"利\":{\"用\":1,\"益\":2,\"を\":1},\"用\":{\"す\":1,\"激\":2},\"益\":{\"は\":1,\"で\":1},\"反\":{\"射\":1,\"転\":1},\"射\":{\"的\":1,\"向\":2},\"的\":{\"利\":1,\"権\":1,\"日\":2,\"臉\":4},\"建\":{\"築\":1},\"築\":{\"基\":1},\"基\":{\"準\":1,\"づ\":1},\"準\":{\"法\":1},\"づ\":{\"い\":1},\"定\":{\"が\":1,\"戦\":1},\"敷\":{\"地\":1},\"有\":{\"者\":1,\"强\":2,\"雨\":2},\"者\":{\"に\":1,\"\":1},\"為\":{\"の\":1},\"排\":{\"除\":1},\"除\":{\"を\":1},\"求\":{\"め\":1},\"。→\":{\"誤\":1},\"誤\":{\"\":1},\"@takuramix:\":{\"福\":1},\"福\":{\"島\":4},\"島\":{\"第\":4},\"原\":{\"発\":4},\"発\":{\"の\":2,\"\":2,\"動\":2},\"構\":{\"内\":2},\"内\":{\"地\":2,\"蒙\":2,\"由\":1},\"図\":{\"が\":2},\"\\nhttp://t.co/ZkU4TZCGPG\":{\"\\n\":2},\"、１\":{\"号\":2},\"号\":{\"機\":4,\"を\":1,\"\":2},\"機\":{\"\":4},\"\\nRT\":{\"@Lightworker19:\":2},\"@Lightworker19:\":{\"\":2},\"拡\":{\"散\":2},\"散\":{\"\":2},\"　４\":{\"号\":2},\"爆\":{\"発\":2,\"笑\":1},\"　40\":{\"秒\":2},\"秒\":{\"～\":2},\"　http://t.co/lmlgp38fgZ\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2},\"四\":{\"川\":4},\"盆\":{\"地\":4},\"江\":{\"淮\":4},\"淮\":{\"等\":2,\"东\":2},\"等\":{\"地\":4},\"将\":{\"有\":4,\"迎\":2},\"强\":{\"降\":2},\"降\":{\"雨\":2},\"开\":{\"学\":4},\"多\":{\"地\":2},\"网\":{\"8\":2},\"电\":{\"据\":2},\"据\":{\"中\":2},\"央\":{\"气\":2,\"東\":1},\"气\":{\"象\":2,\"\":2},\"消\":{\"息\":2,\"さ\":1},\"息\":{\"，\":2},\"，\":{\"江\":2,\"是\":2,\"内\":2,\"觀\":2,\"竟\":2},\"东\":{\"部\":2,\"北\":2},\"部\":{\"\":5,\"等\":2},\"(31\":{\"日\":2},\"又\":{\"将\":2},\"迎\":{\"来\":2},\"场\":{\"暴\":2},\"暴\":{\"雨\":4},\"或\":{\"大\":2},\"明\":{\"天\":4,\"日\":1},\"是\":{\"中\":2,\"非\":1},\"预\":{\"计\":2},\"计\":{\"明\":2},\"蒙\":{\"古\":2},\"古\":{\"中\":2,\"品\":1},\"、...\":{\"http://t.co/toQgVlXPyH\":1,\"http://t.co/RNdqIHmTby\":1},\"http://t.co/toQgVlXPyH\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@Take3carnifex\":{\"そ\":1},\"命\":{\"に\":1},\"非\":{\"う\":1},\"診\":{\"し\":1},\"ｗｗ\":{\"珍\":1},\"珍\":{\"解\":1},\"解\":{\"答\":1},\"答\":{\"集\":1,\"だ\":1},\"集\":{\"！\":1},\"先\":{\"生\":1},\"甘\":{\"さ\":1},\"徒\":{\"の\":1,\"会\":1},\"感\":{\"じ\":1},\"問\":{\"一\":1},\"FB\":{\"で\":1},\"話\":{\"題\":1},\"題\":{\"！！\":1},\"ィ\":{\"ン\":1,\"ア\":1},\"ズ\":{\"9\":1,\"ミ\":1},\"重\":{\"高\":1},\"竹\":{\"内\":1},\"由\":{\"恵\":1},\"恵\":{\"ア\":1},\"ナ\":{\"花\":1},\"花\":{\"火\":1},\"火\":{\"保\":1},\"保\":{\"険\":1},\"険\":{\"\":1},\"\\nhttp://t.co/jRWJt8IrSB\":{\"http://t.co/okrAoxSbt0\":1},\"http://t.co/okrAoxSbt0\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@nasan_arai\":{\"\\n\":1},\"誰\":{\"\":1},\"。(´\":{\"･\":1},\"･\":{\"_\":3,\"`)\":1,\"ω\":1,\")\":1,\"`)♡GEM\":1,\"`)♡\":1},\"_\":{\"･\":3},\"`)\":{\"\\n\":1},\"♡\":{\"\\nLINE\":1,\"五\":1},\"？→\":{\"し\":1},\"｢\":{\"･\":1,\"\":1},\"ω\":{\"･\":1},\"可\":{\"愛\":1},\"愛\":{\"い\":1,\"し\":1},\"優\":{\"し\":3},\"〜(´\":{\"･\":1},\"`)♡GEM\":{\"現\":1},\"(´\":{\"･\":1},\"`)♡\":{\"\\n\\n#\":1},\"\\n\\n#\":{\"ふ\":1},\"ぼ\":{\"し\":1},\"\\\"\":{\"ソ\":1,\"剣\":1},\"ソ\":{\"ー\":3},\"マ\":{\"ス\":2,\"イ\":1},\"剣\":{\"聖\":2,\"士\":1,\"の\":1},\"聖\":{\"カ\":1,\"\":1},\"ミ\":{\"イ\":1,\"(CV:\":1},\"(CV:\":{\"緑\":1},\"緑\":{\"川\":1},\")-\":{\"「\":1},\"長\":{\"に\":1,\"と\":1},\"称\":{\"号\":1},\"士\":{\"\":1},\"匠\":{\"\":1},\"敵\":{\"味\":1},\"尊\":{\"敬\":1},\"敬\":{\"さ\":1},\"流\":{\"の\":1},\"武\":{\"人\":1},\"闇\":{\"\":2},\"付\":{\"き\":1},\"歳\":{\"の\":1},\"差\":{\"以\":1},\"以\":{\"外\":1},\"外\":{\"に\":1},\"壁\":{\"が\":1},\"隊\":{\"の\":1},\"風\":{\"紀\":1},\"紀\":{\"厨\":1},\"厨\":{\"の\":1},\"泣\":{\"か\":1},\"シ\":{\"メ\":1},\"×\":{\"す\":1},\"執\":{\"行\":1},\"不\":{\"純\":1},\"純\":{\"な\":1},\"締\":{\"ま\":1},\"「（\":{\"消\":1},\"\\\"@BelloTexto:\":{\"¿Quieres\":1},\"¿Quieres\":{\"ser\":1},\"ser\":{\"feliz?\":1},\"feliz?\":{\"\\n\":1},\"\\\"No\":{\"stalkees\\\"\":5,\"stalkees\\\".\\\"\":1},\"stalkees\\\"\":{\"\\n\":5},\"stalkees\\\".\\\"\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@kaoritoxx\":{\"そ\":1},\"職\":{\"場\":1},\"(°_°)！\":{\"満\":1},\"喫\":{\"幸\":1},\"幸\":{\"せ\":1},\"焼\":{\"け\":1},\"！！w\":{\"あ\":1},\"ほ\":{\"ど\":1},\"毎\":{\"回\":1},\"五\":{\"月\":1},\"九\":{\"月\":1},\"恐\":{\"ろ\":1},\"ポ\":{\"タ\":1},\"？？\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@itsukibot_\":{\"一\":1},\"稀\":{\"の\":1},\"音\":{\"は\":1},\"冥\":{\"の\":2},\"標\":{\"VI\":2},\"VI\":{\"宿\":2},\"宿\":{\"怨\":2},\"怨\":{\"PART1\":2},\"PART1\":{\"/\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"/\":{\"小\":1},\"水\":{\"\":1},\"\\nhttp://t.co/fXIgRt4ffH\":{\"\\n\":1},\"\\n#\":{\"キ\":1},\"http://t.co/RNdqIHmTby\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@vesperia1985\":{\"お\":1},\"…！！\":{\"明\":1},\"映\":{\"画\":1},\"パ\":{\"ン\":1},\"永\":{\"遠\":2},\"遠\":{\"の\":2},\"０\":{\"（\":1},\"ゼ\":{\"ロ\":1},\"監\":{\"督\":1},\"督\":{\"\":1},\"貴\":{\"\":1},\"岡\":{\"田\":1},\"准\":{\"一\":1},\"春\":{\"馬\":1},\"馬\":{\"\":1},\"井\":{\"上\":1},\"真\":{\"央\":1},\"宝\":{\"(2)11\":1},\"(2)11\":{\"点\":1},\"点\":{\"の\":1},\"品\":{\"／\":1,\"を\":1,\"の\":1},\"／\":{\"中\":1},\"￥\":{\"500\":1},\"\\n(\":{\"こ\":1},\"商\":{\"品\":1},\"式\":{\"な\":1,\"，\":2},\"情\":{\"報\":1},\"報\":{\"に\":1},\"ム\":{\"...\":1},\"...\":{\"http://t.co/4hbyB1rbQ7\":1},\"http://t.co/4hbyB1rbQ7\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"@siranuga_hotoke:\":{\"ゴ\":1},\"ゴ\":{\"キ\":2},\"ブ\":{\"リ\":2},\"世\":{\"帯\":2},\"帯\":{\"に\":2},\"均\":{\"し\":2},\"匹\":{\"い\":2},\"@fightcensorship:\":{\"李\":1},\"李\":{\"克\":4},\"克\":{\"強\":4},\"強\":{\"總\":2,\"的\":2},\"總\":{\"理\":4},\"理\":{\"的\":2,\"李\":2},\"臉\":{\"綠\":2,\"\":2},\"綠\":{\"了\":2},\"南\":{\"京\":2},\"青\":{\"奧\":2},\"奧\":{\"會\":2},\"會\":{\"閉\":2},\"閉\":{\"幕\":2},\"幕\":{\"式\":2},\"觀\":{\"眾\":2},\"眾\":{\"席\":2},\"席\":{\"上\":2},\"貪\":{\"玩\":2},\"玩\":{\"韓\":2},\"韓\":{\"國\":2},\"國\":{\"少\":2,\"總\":2},\"少\":{\"年\":2},\"運\":{\"動\":2},\"員\":{\"，\":2},\"竟\":{\"斗\":2},\"斗\":{\"膽\":2},\"膽\":{\"用\":2},\"激\":{\"光\":2},\"筆\":{\"射\":2},\"向\":{\"中\":2},\"。http://t.co/HLX9mHcQwe\":{\"http://t.co/fVVOSML5s8\":2},\"http://t.co/fVVOSML5s8\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2},\"彩\":{\"り\":1},\"妖\":{\"怪\":1},\"怪\":{\"体\":1},\"転\":{\"\":1},\"http://t.co/PjL9if8OZC\":{\"#sm24357625\":1},\"#sm24357625\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1}}"
    ) as Record<string, Record<string, number>>;
}

// Returns a MarkovChain for prediciting the user description field of TwitterJson. The Chain is compatible with the SpaceEfficientMarkovChain Class
export function getTwitterJsonUserDescFieldMarkovChain() {
    return JSON.parse(
        "{\"1\":{\"と\":1},\"2\":{\"ね\":1,\"人\":1},\"18\":{\"歳\":1},\"24\":{\"/\":1},\"元\":{\"野\":1,\"勃\":1,\"\":1},\"MARKOV_SENTENCE_BEGIN_KEY_01$#@%^#\":{\"24\":1,\"元\":1,\"無\":1,\"プ\":1,\"RT\":1,\"ぱ\":1,\"猫\":1,\"湯\":1,\"川\":1,\"bot\":1,\"ア\":2,\"ﾟ\":1,\"2310*basketball#41*UVERworld*Pooh☪Bell\":1,\"宮\":1,\"や\":3,\"自\":61,\"人\":1,\"F1.GP2.Superformula.SuperGT.F3...\":1,\"ブ\":1,\"思\":3,\"銀\":1,\"HQ!!\":2,\"さ\":1,\"み\":3,\"動\":1,\"ラ\":1,\"と\":1,\"ど\":1,\"ふ\":1,\"デ\":2,\"深\":1,\"な\":3,\"ROM\":1,\"漫\":1,\"普\":2,\"す\":1,\"イ\":1,\"#\":1,\"解\":1,\"G\":1,\"女\":2,\"腐\":1,\"こ\":2,\"ジ\":1,\"＼\":1,\"ウ\":1,\"THE\":1,\"Yahoo\":1,\"世\":1,\"成\":1,\"ヤ\":1,\"兵\":1,\"知\":3,\"私\":2,\"大\":1,\"ほ\":1,\"行\":1,\"い\":1,\"\":3,\"hack\":1,\"話\":1,\"⁽⁽٩(\":1,\"ProjectDIVA\":1,\"美\":1,\"日\":1,\"ス\":1,\"cambiando\":1,\"異\":1,\"男\":1,\"オ\":1,\"意\":1,\"見\":1,\"ONE\":1,\"豊\":1,\"誰\":1,\"素\":1,\"か\":1,\"も\":1,\"楽\":1,\"た\":1,\"中\":1,\"LDH\":1,\"あ\":1,\"サ\":1,\"家\":1,\"君\":1,\"き\":1,\"经\":1,\"被\":1,\"ニ\":1},\"野\":{\"球\":3,\"郎\":1,\"悠\":1,\"）\":1},\"球\":{\"部\":2,\"選\":1},\"部\":{\"マ\":1,\"分\":1,\"受\":1,\"京\":1,\"を\":1,\"変\":1,\"屋\":1},\"マ\":{\"ネ\":2,\"ン\":2,\"っ\":1,\"ホ\":2,\"ッ\":1,\"\":1,\"セ\":1,\"ジ\":1,\"の\":1,\"メ\":1,\"ー\":1},\"ネ\":{\"2\":1,\"ー\":1,\"タ\":4,\"ス\":1,\"ッ\":1},\"ー\":{\"ジ\":1,\"❤︎…\":1,\"は\":2,\"ム\":2,\"\":4,\"を\":9,\"マ\":1,\"ズ\":5,\"ト\":7,\"し\":3,\"さ\":1,\"屋\":1,\"な\":1,\"で\":88,\"パ\":1,\"GT\":1,\"ツ\":3,\"ス\":2,\"に\":1,\"お\":22,\"/BLEACH/\":1,\"の\":4,\"フ\":1,\"も\":3,\"多\":1,\"非\":1,\"ド\":6,\"返\":1,\"ク\":3,\"・\":1,\"ワ\":1,\"ザ\":1,\"ア\":1,\"(\":1,\"DJ\":1,\"プ\":1,\"あ\":1,\"ル\":1,\"カ\":1,\"好\":1,\"ロ\":1,\"リ\":1,\"キ\":1,\"と\":1,\"エ\":1},\"ジ\":{\"ャ\":4,\"カ\":1,\"ー\":2,\"ニ\":1,\"ュ\":1,\"ダ\":1,\"で\":1},\"ャ\":{\"ー\":1,\"ッ\":2,\"ラ\":2,\"ン\":2,\"ニ\":2,\"イ\":1,\"レ\":1},\"❤︎…\":{\"最\":1},\"最\":{\"高\":1,\"近\":2,\"愛\":1,\"後\":1},\"高\":{\"の\":1,\"校\":2,\"生\":5,\"河\":1},\"の\":{\"2\":1,\"夏\":1,\"サ\":1,\"キ\":1,\"壱\":1,\"目\":2,\"手\":1,\"街\":1,\"元\":1,\"犬\":1,\"わ\":1,\"で\":10,\"り\":1,\"の\":1,\"画\":2,\"つ\":1,\"な\":1,\"川\":1,\"た\":2,\"あ\":2,\"趣\":2,\"自\":2,\"格\":1,\"心\":1,\"重\":1,\"ス\":3,\"ア\":4,\"事\":2,\"称\":1,\"本\":3,\"気\":1,\"際\":2,\"は\":1,\"間\":1,\"も\":1,\"プ\":1,\"動\":1,\"写\":1,\"か\":6,\"人\":5,\"オ\":3,\"秘\":1,\"A\":1,\"非\":1,\"台\":1,\"カ\":1,\"や\":2,\"有\":1,\"デ\":2,\"中\":2,\"末\":1,\"予\":1,\"甲\":1,\"想\":1,\"ま\":1,\"建\":2,\"～？\":1,\"リ\":1,\"過\":1,\"都\":2,\"領\":1,\"発\":2,\"裏\":1,\"東\":1,\"フ\":1,\"機\":1,\"方\":1,\"夢\":1,\"に\":3,\"男\":1,\"６\":1,\"\":2,\"こ\":1,\"モ\":1,\"知\":2,\"生\":2,\"注\":1,\"習\":1,\"ヒ\":1,\"名\":1,\"が\":1,\"雑\":1,\"日\":1,\"住\":1,\"し\":1,\"ど\":1,\"う\":1,\"道\":2,\"対\":1,\"瞳\":1,\"転\":1},\"夏\":{\"を\":1},\"を\":{\"あ\":1,\"プ\":1,\"起\":1,\"つ\":6,\"フ\":1,\"連\":1,\"知\":2,\"ラ\":2,\"磨\":1,\"み\":1,\"精\":58,\"お\":67,\"瞬\":1,\"味\":1,\"キ\":1,\"全\":3,\"\":12,\"見\":19,\"感\":1,\"紹\":2,\"集\":4,\"発\":1,\"抽\":1,\"応\":2,\"守\":1,\"御\":1,\"作\":1,\"や\":1,\"弾\":1,\"疑\":1,\"壊\":1,\"を\":1,\"探\":4,\"理\":1,\"ツ\":1,\"さ\":1,\"除\":1},\"あ\":{\"り\":10,\"ま\":1,\"る\":20,\"ら\":1,\"の\":3,\"げ\":1,\"な\":3,\"れ\":2,\"き\":1,\"い\":1,\"～\":1},\"り\":{\"が\":3,\"好\":1,\"さ\":1,\"も\":59,\"に\":3,\"ま\":7,\"モ\":1,\"た\":2,\"別\":1,\"集\":1,\"嵐\":1,\"無\":1,\"多\":1,\"と\":1,\"や\":1,\"ツ\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"ち\":1,\"つ\":1,\"そ\":1,\"今\":1,\"！\":1,\"す\":1,\"ア\":1,\"い\":1,\"付\":2,\"手\":1,\"だ\":1,\"ぷ\":1},\"が\":{\"と\":3,\"好\":6,\"よ\":2,\"良\":1,\"主\":1,\"せ\":1,\"Ｆ／Ｂ\":1,\"幸\":59,\"あ\":5,\"大\":2,\"で\":1,\"ら\":1,\"ア\":2,\"込\":1,\"BLNL\":1,\"知\":1,\"中\":1,\"ス\":1,\"見\":1,\"聞\":1,\"可\":1,\"欲\":1,\"っ\":1,\"\":2,\"ビ\":1,\"趣\":1,\"仏\":1},\"と\":{\"う\":4,\"動\":1,\"ブ\":1,\"も\":3,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"暮\":1,\"し\":6,\"思\":83,\"か\":3,\"実\":1,\"周\":58,\"が\":1,\"\":3,\"に\":3,\"変\":1,\"い\":2,\"楽\":1,\"八\":1,\"こ\":1,\"ん\":1,\"り\":1,\"全\":1,\"本\":1,\"見\":1,\"ポ\":1,\"呟\":1,\"使\":1,\"で\":2,\"言\":1,\"理\":1,\"驚\":1,\"一\":1,\"早\":1,\"く\":1,\"上\":1,\"な\":1,\"つ\":1,\"弱\":1},\"う\":{\"…❤︎\":1,\"こ\":1,\"\":9,\"た\":1,\"男\":2,\"す\":2,\"♪\":4,\"☆\":1,\"時\":1,\"～♪\":1,\"の\":1,\"LINE\":1,\"内\":2,\"さ\":1,\"だ\":3,\"一\":2,\"ち\":2,\"れ\":1,\"や\":2,\"別\":1,\"と\":1,\"バ\":1,\"理\":1,\"…\":1,\"な\":5,\"に\":2,\"か\":1,\"で\":1,\"つ\":1,\"ご\":1},\"…❤︎\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"無\":{\"言\":2,\"断\":1,\"条\":1},\"言\":{\"フ\":2,\"っ\":4,\"葉\":59,\"は\":1,\"え\":2,\"い\":1,\"や\":1,\"わ\":1,\"论\":2},\"フ\":{\"ォ\":128,\"ご\":2,\"で\":2,\"ァ\":3,\"参\":1,\"レ\":1,\"ィ\":1},\"ォ\":{\"ロ\":127,\"率\":1},\"ロ\":{\"ー\":129,\"ッ\":2,\"フ\":4,\"\":1,\"グ\":2,\"み\":1,\"く\":1,\"様\":1,\"ビ\":4},\"は\":{\"あ\":1,\"MGS\":1,\"ハ\":1,\"月\":1,\"こ\":1,\"な\":1,\"お\":1,\"ブ\":1,\"兄\":1,\"RT\":9,\"\":14,\"譲\":1,\"言\":2,\"い\":1,\"プ\":3,\"皆\":1,\"@assam_yamanaka\":1,\"早\":1,\"思\":1,\"手\":1,\"や\":1,\"若\":1,\"想\":1,\"ツ\":1,\"ま\":1,\"随\":1,\"一\":1,\"何\":1,\"良\":1,\"私\":1,\"・\":1,\"の\":1,\"無\":1,\"元\":1,\"対\":1,\")”○”\":1,\"絶\":1},\"ま\":{\"り\":1,\"せ\":3,\"す\":254,\"ら\":2,\"う\":7,\"れ\":1,\"し\":4,\"で\":3,\"だ\":2,\"ま\":2,\"に\":2,\"め\":1,\"た\":1},\"好\":{\"み\":1,\"き\":24},\"み\":{\"ま\":4,\"し\":1,\"つ\":1,\"な\":22,\"を\":1,\"ん\":4,\"た\":4,\"よ\":1,\"て\":1},\"せ\":{\"ん\":3,\"は\":1,\"て\":1,\"し\":1,\"だ\":58,\"に\":59,\"ら\":1,\"ろ\":1,\"な\":1},\"ん\":{\"ゲ\":1,\"で\":10,\"す\":1,\"＊\":1,\"ち\":1,\"勤\":1,\"上\":1,\"[\":1,\"か\":3,\"\":24,\"な\":77,\"/\":1,\"気\":1,\"お\":1,\"（＾ω＾）\":1,\"だ\":5,\"…\":1,\"ど\":2,\"使\":1,\"探\":1,\"い\":1,\"TEAM\":1,\"友\":1,\"と\":4,\"に\":1,\"・\":1,\"が\":1,\"ラ\":1},\"ゲ\":{\"ー\":2},\"ム\":{\"と\":1,\"リ\":1,\"は\":1,\"に\":2,\"を\":3,\"山\":2},\"動\":{\"画\":3,\"か\":1,\"物\":3,\"で\":2,\"を\":1,\"エ\":1,\"中\":1,\"の\":1},\"画\":{\"が\":1,\"像\":7,\"]\":1,\"\":1,\"家\":1,\"！\":1,\"の\":1},\"き\":{\"で\":3,\"の\":1,\"な\":10,\"\":3,\"る\":117,\"♡\":2,\"！\":4,\"ま\":16,\"た\":1,\"ｗ\":1,\"！（≧∇≦）\":1,\"っ\":1,\"ら\":1,\"を\":1,\"て\":1,\"♩\":1,\"だ\":1,\"も\":1,\"に\":1},\"で\":{\"す\":48,\"緑\":1,\"相\":1,\"る\":1,\"み\":22,\"き\":60,\"\":74,\"サ\":1,\"も\":7,\"あ\":4,\"ご\":3,\"～\":1,\"欲\":1,\"い\":1,\"フ\":1,\"/\":1,\"RT\":1,\"来\":1,\"楽\":1,\"の\":1,\"QMA\":1,\"開\":1,\"く\":1,\"応\":1,\"し\":2,\"お\":3,\"つ\":1,\"幸\":1,\"見\":1,\"は\":1,\"!?\":1,\"ス\":1,\"踊\":1},\"す\":{\"シ\":1,\"が\":5,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2,\"\":153,\"か\":1,\"と\":1,\"／\":1,\"♬\":1,\"る\":10,\"♪\":112,\"(๑´ㅂ`๑)♡*.+゜\":1,\"の\":3,\"！\":8,\"注\":2,\"♥\":2,\"す\":1,\"み\":1,\"ぐ\":3,\"/\":1,\"☆\":3,\"ぎ\":4,\"ね\":2,\"!!(^_-)-☆\":1,\"よ\":1,\"き\":1,\"w\":1,\"!!\":2,\"あ\":1},\"シ\":{\"モ\":1,\"リ\":1,\"ー\":1,\"ョ\":1,\"ル\":1,\"ロ\":1,\"ャ\":1,\"バ\":1,\"伝\":1,\"ェ\":1},\"モ\":{\"野\":1,\"✯\":1,\"テ\":4,\"ン\":2,\"ジ\":1,\"シ\":1},\"郎\":{\"で\":1},\"よ\":{\"ろ\":5,\"言\":1,\"る\":1,\"う\":6,\"☆～（ゝ\":1,\"ね\":1,\"っ\":1,\"！\":1,\"ww]\":1},\"ろ\":{\"し\":5,\"い\":2,\"集\":1,\"か\":4,\"エ\":1,\"ミ\":1,\"う\":3,\"ん\":1,\"り\":1,\"ー\":1},\"し\":{\"く\":9,\"て\":19,\"な\":1,\"詳\":1,\"ま\":206,\"か\":2,\"\":1,\"い\":13,\"愛\":1,\"た\":4,\"の\":1,\"ん\":2,\"ろ\":7,\"づ\":1,\"は\":1,\"よ\":1,\"ょ\":4,\"で\":1,\"ら\":1,\"そ\":3,\"学\":1,\"す\":2,\"求\":1,\"ゅ\":1},\"く\":{\"…\":2,\"お\":4,\"だ\":7,\"さ\":1,\"な\":4,\"bot\":1,\"ヒ\":1,\"れ\":3,\"\":1,\"ら\":1,\"の\":1,\"ん\":2,\"は\":2,\"わ\":1,\"よ\":2,\"て\":1,\"る\":1,\"知\":1,\"べ\":1,\"い\":1,\"♪\":1,\"ね\":1,\"用\":1},\"…\":{\"最\":1,\"。\":2,\"。@ringo_BDFFLOVE\":1},\"近\":{\"は\":2},\"MGS\":{\"と\":1},\"ブ\":{\"レ\":1,\"ル\":1,\"ロ\":3,\"リ\":1,\"ア\":1,\"ラ\":3,\"度\":1,\"が\":1,\"フ\":1,\"で\":1},\"レ\":{\"イ\":3,\"ー\":4,\"ス\":1,\"有\":1,\"ン\":3,\"色\":1,\"ギ\":1,\"か\":1,\"し\":1,\"も\":1},\"イ\":{\"ブ\":3,\"し\":1,\"ム\":1,\"バ\":1,\"ガ\":1,\"コ\":2,\"ヤ\":4,\"キ\":1,\"ー\":6,\"含\":2,\"ト\":1,\"ザ\":1,\"ン\":2,\"イ\":2,\"女\":1,\"で\":1,\"ラ\":2,\"と\":2,\"画\":1,\"記\":1,\"カ\":1,\"ジ\":2,\"プ\":3,\"タ\":1,\"中\":1,\"テ\":2},\"ル\":{\"ー\":1,\"ッ\":1,\"は\":1,\"ド\":1,\"バ\":1,\"プ\":1,\"・\":1,\"フ\":2,\"ロ\":1,\"が\":1},\"\":{\"、\":192,\"。\":188,\"　\":4,\"\\n\":1,\"々TL\":1,\"」\":15,\"「POTENZA\":1,\"「\":11,\"。FRB\":2,\"』\":3,\"\\r\\n\":1,\"々\":5,\"『\":1,\"。TV\":1,\"『THE\":1,\"。/\":1,\"、BL～\":1,\"】9/20-22\":1,\"。※140\":1,\"【\":1,\"】\":2,\"、……\":1,\"、BDFF\":1,\"。CP\":1,\"、H\":1,\"〜\":2,\"、Furniture）\":1},\"、\":{\"音\":1,\"最\":2,\"お\":91,\"大\":1,\"子\":1,\"日\":3,\"庭\":1,\"ラ\":2,\"手\":1,\"い\":3,\"「\":2,\"人\":1,\"タ\":1,\"応\":1,\"返\":1,\"ご\":1,\"実\":1,\"つ\":1,\"あ\":8,\"愛\":1,\"選\":1,\"素\":1,\"た\":1,\"見\":2,\"ニ\":1,\"や\":1,\"嵐\":1,\"ち\":1,\"ど\":1,\"困\":1,\"必\":2,\"腐\":1,\"わ\":2,\"気\":2,\"も\":2,\"と\":1,\"是\":4,\"ま\":2,\"ト\":1,\"行\":1,\"代\":1,\"表\":1,\"そ\":2,\"神\":1,\"演\":1,\"ネ\":1,\"プ\":1,\"翻\":1,\"シ\":2,\"ギ\":1,\"\\r\\n\":1,\"私\":1,\"フ\":1,\"妹\":1,\"会\":1,\"全\":2,\"ツ\":1,\"思\":1,\"美\":2,\"動\":1,\"男\":1,\"本\":1,\"こ\":1,\"ロ\":1,\"ル\":1,\"声\":1,\"コ\":1,\"進\":1,\"ク\":1,\"ド\":1,\"怖\":1,\"り\":1,\"家\":1,\"作\":1,\"建\":1,\"後\":1,\"党\":1,\"光\":1},\"音\":{\"ゲ\":1,\"を\":1,\"\":1,\"も\":1,\"リ\":1},\"プ\":{\"レ\":2,\"リ\":3,\"ロ\":7,\"す\":1,\"ラ\":1,\"\":1,\")\":1,\"な\":1,\"だ\":1},\"て\":{\"ま\":4,\"TL\":1,\"る\":8,\"い\":30,\"強\":1,\"く\":8,\"し\":6,\"人\":6,\"も\":5,\"き\":2,\"愛\":1,\"紹\":2,\"み\":5,\"\":4,\"ほ\":1,\"楽\":1,\"応\":1,\"笑\":2,\"あ\":2,\"自\":1,\"心\":1,\"作\":1,\"ツ\":1,\"仲\":1,\"少\":1,\"今\":1,\"の\":1,\"利\":1,\"は\":1,\")”×”\":1},\"リ\":{\"キ\":2,\"ー\":5,\"フ\":1,\"ヂ\":1,\"/\":1,\"プ\":1,\"か\":1,\"ア\":2,\"テ\":1,\"\":1,\"ン\":1},\"キ\":{\"ュ\":5,\"ャ\":4,\"ー\":1,\"ン\":1,\"な\":1,\"を\":1},\"ュ\":{\"ア\":2,\"ー\":3,\"ン\":2,\"ラ\":1},\"ア\":{\"好\":1,\"シ\":1,\"カ\":12,\"ニ\":3,\"イ\":4,\"ッ\":3,\"ル\":1,\"ー\":1,\"リ\":1,\"\":1,\"ク\":1,\"ナ\":1,\"し\":1,\"デ\":1,\"を\":1},\"サ\":{\"ラ\":1,\"ポ\":1,\"ブ\":1,\"ム\":2,\"ン\":1,\"イ\":2,\"ワ\":3,\"リ\":1,\"マ\":1},\"ラ\":{\"リ\":1,\"ク\":1,\"ン\":4,\"イ\":5,\"ブ\":5,\"ス\":2,\"テ\":1,\"が\":1,\"マ\":2,\"ー\":1},\"ン\":{\"で\":1,\"ニ\":1,\"グ\":3,\"バ\":1,\"ト\":13,\"/\":1,\"は\":4,\"ダ\":2,\"の\":3,\"も\":1,\"ピ\":1,\"タ\":1,\"に\":1,\"と\":2,\"ル\":1,\"デ\":1,\"\":3,\"ド\":2,\"パ\":2,\"系\":1,\"ガ\":1,\"ジ\":2,\"ハ\":1,\"が\":1,\"FutureStyle\":1,\"仕\":1,\"キ\":1,\"ち\":1,\"テ\":1},\"。\":{\"好\":1,\"http://t.co/QMLJeFmfMT\":1,\"猫\":1,\"よ\":1,\"害\":1,\"の\":1,\"さ\":1,\"車\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":89,\"タ\":1,\"成\":1,\"時\":2,\"リ\":1,\"ス\":1,\"\\r\\n\":35,\"レ\":1,\"今\":2,\"日\":2,\"赤\":2,\"フ\":2,\"サ\":1,\"『\":1,\"そ\":2,\"当\":1,\"こ\":1,\"ツ\":1,\"最\":1,\"地\":1,\"腐\":1,\"他\":1,\"　\":4,\"週\":1,\"主\":1,\"4/18.\":1,\"紫\":1,\"\\r\\n9/13（\":1,\"」\":1,\"役\":1,\"気\":2,\"雑\":1,\"詳\":1,\"ア\":1,\"問\":1,\"基\":1,\"解\":1,\"私\":1,\"モ\":1,\"\\nSPRING\":1,\"で\":1,\"「\":1,\"ロ\":1,\"ル\":1,\"ゾ\":1,\"え\":1,\"な\":1,\"致\":1,\"既\":1,\"嵐\":1,\"ブ\":1},\"な\":{\"プ\":1,\"い\":24,\"ど\":4,\"方\":1,\"ん\":8,\"る\":7,\"ら\":3,\"ネ\":1,\"れ\":4,\"り\":3,\"さ\":22,\"人\":60,\"言\":59,\"と\":63,\"お\":2,\"男\":2,\"に\":1,\"が\":2,\"ペ\":1,\"っ\":4,\"日\":1,\"ド\":1,\"愛\":1,\"の\":4,\"ジ\":1,\"笑\":1,\"会\":1,\"～\":1,\"で\":1,\"ラ\":1,\"昔\":1,\"''\":1,\"ギ\":1,\"キ\":1,\"た\":3,\"行\":1,\"思\":1,\"\":4,\"世\":1,\"ぁ\":1,\"ス\":2,\"気\":1,\"素\":2,\"ろ\":1,\"生\":1,\"究\":1,\"恋\":1,\"感\":1,\"ケ\":1,\"ア\":1,\"私\":1,\"ふ\":1,\"イ\":1,\"か\":1,\"情\":1},\"ズ\":{\"は\":1,\"ン\":1,\"ニ\":2,\"や\":1,\"の\":1,\"好\":1,\"も\":1},\"ハ\":{\"ー\":1,\"イ\":1,\"ン\":2,\"マ\":1},\"ト\":{\"キ\":1,\"で\":8,\"\":1,\"ラ\":1,\"を\":4,\"ン\":1,\"し\":2,\"は\":1,\"多\":2,\"@sachi_dears\":1,\"が\":1,\"数\":1,\"＞http://t.co/jVqBoBEc\":1,\"ッ\":1,\"大\":1,\"ワ\":1,\"レ\":1,\"に\":1,\"ー\":1},\"ッ\":{\"チ\":3,\"ク\":4,\"サ\":2,\"プ\":2,\"コ\":2,\"ト\":3,\"ズ\":1},\"チ\":{\"\":1,\"ャ\":2,\"コ\":1,\"ー\":1,\"ル\":1,\"ッ\":1,\"す\":1},\"愛\":{\"の\":1,\"し\":3,\"さ\":1,\"情\":1,\"い\":1,\"経\":1,\"に\":1},\"ク\":{\"タ\":1,\"！[HOT]K[\":1,\"ソ\":2,\"を\":1,\"な\":1,\"シ\":1,\"か\":1,\"エ\":1,\"セ\":1,\"×\":1,\"レ\":1},\"タ\":{\"ー\":4,\"イ\":7,\"は\":1,\"バ\":1,\"雑\":1,\"や\":1},\"月\":{\"影\":1,\"克\":1},\"影\":{\"ゆ\":1},\"ゆ\":{\"り\":1,\"ん\":1},\"さ\":{\"ん\":32,\"せ\":2,\"み\":1,\"ら\":1,\"を\":1,\"れ\":5,\"い\":7,\"ち\":1,\"す\":1},\"http://t.co/QMLJeFmfMT\":{\"ご\":1},\"ご\":{\"質\":1,\"自\":1,\"了\":1,\"一\":2,\"確\":1,\"注\":2,\"ざ\":1},\"質\":{\"問\":1},\"問\":{\"\":1,\"い\":1,\"題\":3,\"（\":1},\"お\":{\"問\":1,\"願\":121,\"気\":3,\"騒\":1,\"さ\":1,\"届\":64,\"う\":2,\"\":2,\"考\":2,\"も\":7,\"か\":1,\"熱\":1,\"・\":1,\"断\":1,\"お\":2,\"～\":2,\"く\":1,\"伝\":1,\"返\":1},\"い\":{\"合\":1,\"方\":2,\"よ\":1,\"し\":120,\"ま\":21,\"て\":10,\"た\":8,\"犬\":1,\"こ\":5,\"ち\":3,\"記\":1,\"と\":8,\"\":13,\"好\":1,\"で\":13,\"！\":3,\"い\":74,\"な\":67,\"き\":5,\"場\":1,\"致\":3,\"っ\":2,\"あ\":1,\"（＾∇＾）✨\":1,\"内\":2,\"る\":8,\"画\":2,\"意\":1,\"風\":1,\"ろ\":3,\"の\":3,\"つ\":2,\"う\":4,\"イ\":1,\"気\":1,\"挨\":1,\"台\":1,\"所\":1,\"や\":2,\"ネ\":1,\"♪\":2,\"人\":4,\"ｗ\":1,\"も\":1,\"ス\":1,\"ね\":2,\"を\":1,\"ど\":1,\"☆\":1,\"！(\":1,\"女\":2,\"♥\":1,\"男\":1,\"(\":1,\"ペ\":1,\"れ\":1,\"く\":1,\"ー\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"合\":{\"わ\":1,\"も\":1,\"上\":1},\"わ\":{\"せ\":1,\"か\":11,\"お\":1,\"ず\":6,\"い\":5,\"り\":1,\"れ\":1,\"っ\":1,\"る\":1},\"こ\":{\"ち\":1,\"す\":1,\"と\":11,\"さ\":1,\"っ\":1,\"の\":2,\"れ\":2,\"こ\":1,\"ま\":1,\"う\":1,\"ん\":2,\"で\":1},\"ち\":{\"ら\":1,\"ゃ\":8,\"い\":1,\"訳\":1,\"❷)\":1,\"の\":1,\"ょ\":1,\"ば\":1,\"ろ\":1,\"に\":1,\"あ\":1,\"家\":1,\"わ\":1},\"ら\":{\"http://t.co/LU8T7vmU3h\":1,\"フ\":1,\"な\":12,\"し\":2,\"大\":1,\"だ\":2,\"！\":1,\"に\":1,\"RT\":99,\"え\":3,\"生\":1,\"れ\":5,\"ぶ\":1,\"DM\":1,\"は\":1,\"商\":1,\"い\":2,\"出\":1,\"是\":2,\"\":4,\"別\":1,\"!?\":1,\"め\":1,\"で\":1,\"見\":1,\"ら\":1,\"置\":1,\"ぬ\":1},\"http://t.co/LU8T7vmU3h\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"/\":{\"XXX\":1,\"@andprotector\":1,\"@lifefocus0545\":1,\"ト\":1,\"進\":2,\"森\":1,\"高\":1,\"演\":1,\"黒\":1,\"ハ\":1,\"鈴\":1,\"神\":1,\"現\":2,\"フ\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"XXX\":{\"/\":1},\"@andprotector\":{\"/\":1},\"@lifefocus0545\":{\"potato\":1},\"potato\":{\"design\":1},\"design\":{\"works\":1},\"works\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"RT\":{\"し\":2,\"&\":107,\"＆\":8,\"禁\":1},\"TL\":{\"に\":1,\"反\":1},\"に\":{\"濁\":1,\"な\":12,\"よ\":1,\"入\":10,\"あ\":1,\"\":4,\"貢\":1,\"記\":1,\"つ\":7,\"で\":59,\"必\":58,\"に\":1,\"動\":1,\"フ\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2,\"も\":2,\"生\":2,\"係\":1,\"か\":1,\"は\":5,\"着\":1,\"思\":1,\"見\":1,\"呟\":1,\"使\":1,\"立\":2,\"七\":1,\"大\":1,\"し\":2,\"RT\":1,\"ハ\":1,\"南\":1,\"閉\":1,\"マ\":1,\"や\":2,\"残\":2,\"絡\":1,\"お\":1,\"コ\":1,\"相\":1,\"た\":1,\"が\":1,\"御\":1,\"い\":2,\"出\":1,\"モ\":1,\"!?\":1,\"一\":1,\"ロ\":1,\"す\":1,\"据\":1,\"作\":1,\"う\":1,\"乾\":1,\"嬉\":1,\"頑\":1},\"濁\":{\"流\":1},\"流\":{\"を\":1},\"起\":{\"こ\":1,\"YUNHO＆CHANGMIN\":1,\"及\":1},\"か\":{\"ら\":11,\"つ\":1,\"な\":3,\"た\":1,\"し\":4,\"っ\":20,\"る\":5,\"く\":1,\"り\":2,\"わ\":7,\"ん\":2,\"も\":2,\"！？\":1,\"～♪\":1,\"を\":1,\"は\":1,\"よ\":1,\"ち\":1,\"\":1,\"？\":1,\"い\":1,\"ぐ\":1,\"れ\":1},\"方\":{\"が\":1,\"@1life_5106_hshd\":1,\"を\":1,\"丁\":1,\"神\":2,\"・\":1,\"の\":1},\"良\":{\"い\":1,\"く\":1},\"っ\":{\"て\":37,\"た\":113,\"ぱ\":6,\"そ\":1,\"ち\":4,\"と\":4,\"か\":1,\"\":3,\"！\":1,\"˘ω˘c\":1},\"る\":{\"こ\":2,\"の\":6,\"と\":8,\"川\":1,\"あ\":7,\"ア\":2,\"系\":1,\"人\":3,\"！\":59,\"た\":59,\"\":6,\"け\":1,\"ん\":2,\"っ\":2,\"を\":3,\"も\":3,\"べ\":2,\"事\":1,\"表\":1,\"だ\":5,\"素\":1,\"な\":2,\"部\":1,\"下\":1,\"フ\":1,\"問\":1,\"イ\":1,\"／\":1,\"ミ\":1,\"ボ\":1,\"り\":1,\"三\":1,\"非\":1,\"画\":1,\"か\":2,\"危\":1,\"程\":1,\"で\":1,\"場\":1,\"ラ\":1,\"よ\":3,\"！？\":1,\"☆\":1,\"～\":1,\"学\":1,\"お\":1,\"比\":2,\"が\":1,\"僕\":1,\"い\":1,\"腐\":1},\"も\":{\"つ\":2,\"も\":1,\"こ\":3,\"の\":6,\"幸\":58,\"好\":6,\"\":6,\"あ\":3,\"ホ\":1,\"わ\":1,\"ら\":3,\"使\":1,\"お\":3,\"し\":7,\"は\":1,\"う\":3,\"''\":1,\"教\":1,\"宜\":1,\"め\":1,\"♪\":1,\"大\":1,\"多\":1,\"!?\":1,\"文\":1,\"や\":1,\"人\":1,\"記\":1,\"コ\":1,\"食\":1,\"っ\":2,\"い\":1,\"呟\":1,\"ち\":1},\"つ\":{\"ま\":1,\"ぶ\":14,\"い\":5,\"け\":19,\"か\":3,\"練\":1,\"ハ\":1,\"の\":1,\"と\":1,\"恋\":1,\"る\":1},\"詳\":{\"細\":1,\"し\":2},\"細\":{\"→http://t.co/ANSFlYXERJ\":1},\"→http://t.co/ANSFlYXERJ\":{\"相\":1},\"相\":{\"方\":1,\"当\":1,\"互\":91,\"手\":1},\"@1life_5106_hshd\":{\"葛\":1},\"葛\":{\"西\":1},\"西\":{\"教\":1,\"→\":1},\"教\":{\"徒\":1,\"え\":1},\"徒\":{\"そ\":1},\"そ\":{\"の\":3,\"ん\":70,\"り\":1,\"し\":1,\"う\":6,\"れ\":2},\"壱\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"ぱ\":{\"ん\":1,\"り\":5,\"い\":1},\"猫\":{\"×6\":1,\"\":1,\"＊\":1},\"×6\":{\"、\":1},\"大\":{\"学\":1,\"\":2,\"好\":4,\"人\":2,\"会\":1,\"型\":2},\"学\":{\"・\":1,\"を\":1,\"苑\":1,\"ぶ\":1,\"や\":1,\"生\":1},\"・\":{\"高\":1,\"旦\":1,\"あ\":1,\"兵\":1,\"R18\":1,\"ネ\":1,\"チ\":1,\"ん\":1,\"な\":1,\"非\":1,\"鍵\":1,\"ス\":1,\"・\":2,\"●●\":1},\"校\":{\"・\":1,\"軟\":1},\"旦\":{\"那\":1},\"那\":{\"各\":1},\"各\":{\"1\":1},\"暮\":{\"ら\":1},\"子\":{\"供\":1,\"＊.゜\":1,\"に\":2,\"の\":2,\"\":2,\"中\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"園\":1,\"高\":1,\"な\":1,\"，\":1,\"で\":1},\"供\":{\"\":1,\"給\":1},\"日\":{\"常\":6,\"に\":1,\"も\":1,\"\":1,\"本\":1},\"常\":{\"思\":1,\"ツ\":2,\"の\":2,\"を\":1},\"思\":{\"っ\":80,\"い\":5,\"わ\":6,\"う\":1},\"た\":{\"事\":1,\"だ\":1,\"く\":3,\"も\":2,\"い\":20,\"め\":63,\"二\":1,\"ら\":107,\"プ\":1,\"\":3,\"ま\":1,\"表\":1,\"ち\":2,\"時\":1,\"人\":2,\"/\":1,\"ん\":1,\"の\":5,\"感\":1,\"ど\":1,\"～！\":1,\"よ\":1,\"は\":1},\"事\":{\"を\":1,\"な\":1,\"は\":1,\"情\":1,\"\":1},\"ぶ\":{\"や\":14,\"り\":1,\"こ\":1},\"や\":{\"い\":1,\"か\":1,\"く\":2,\"っ\":11,\"人\":1,\"タ\":1,\"き\":10,\"簡\":1,\"\":4,\"何\":1,\"リ\":1,\"さ\":2,\"芸\":1,\"り\":1,\"グ\":1,\"ろ\":1,\"マ\":1,\"め\":1},\"／\":{\"今\":1,\"猫\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"今\":{\"年\":3,\"シ\":1,\"か\":1,\"日\":1,\"現\":1,\"す\":1,\"天\":1},\"年\":{\"の\":1,\"サ\":1,\"も\":1,\"２３\":1,\"目\":1},\"目\":{\"標\":1,\"的\":1,\"管\":1,\"JSB\":1,\"線\":2,\"ア\":1,\")\":1},\"標\":{\"：\":1},\"：\":{\"読\":1,\"歌\":1},\"読\":{\"書\":1,\"モ\":1,\"お\":2,\"！\":1},\"書\":{\"\":2,\"士\":1},\"庭\":{\"の\":1},\"手\":{\"入\":1,\"芸\":1,\"動\":1,\"権\":1,\"を\":1,\"く\":1,\"や\":1},\"入\":{\"れ\":1,\"り\":1,\"っ\":9},\"れ\":{\"\":1,\"*\":1,\"た\":5,\"る\":8,\"て\":4,\"も\":3,\"し\":1,\"ば\":3,\"ま\":1,\"は\":1,\"ぞ\":1,\"の\":1,\"知\":1,\"ぼ\":1},\"ニ\":{\"ン\":1,\"メ\":3,\"/Ｋ/\":1,\"ー\":5,\"ュ\":1,\"ア\":1,\"コ\":1},\"グ\":{\"\":1,\"の\":1,\"ッ\":1,\"ラ\":1,\"を\":1,\"→http://t.co/8E91tqoeKX\":1},\"芸\":{\"／\":1,\"術\":1},\"＊\":{\"花\":1,\"写\":1,\"詩\":1,\"林\":1,\"鉄\":1},\"花\":{\"＊\":1},\"写\":{\"真\":2},\"真\":{\"＊\":1,\"を\":1},\"詩\":{\"＊\":1},\"林\":{\"も\":1},\"鉄\":{\"道\":1},\"道\":{\"な\":1,\"\":1,\"ぐ\":1,\"具\":3},\"ど\":{\"好\":1,\"を\":3,\"言\":1,\"れ\":1,\"ん\":4,\"う\":3,\"り\":1,\"前\":1},\"だ\":{\"い\":2,\"ら\":1,\"と\":61,\"さ\":6,\"\":2,\"け\":7,\"か\":2,\"言\":2,\"ま\":1,\"知\":1,\"よ\":1,\"っ\":3},\"願\":{\"い\":122},\"♬\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"湯\":{\"の\":1},\"街\":{\"の\":1},\"勃\":{\"酩\":1},\"酩\":{\"姦\":1},\"姦\":{\"な\":1},\"ゃ\":{\"ら\":1,\"う\":3,\"ん\":2,\"い\":1,\"り\":1},\"　\":{\"赤\":1,\"肥\":1,\"主\":1,\"い\":2,\"\\r\\n\":4,\"笑\":1,\"ど\":1,\"「BDFF\":1,\"マ\":2,\"相\":1,\"ぽ\":1,\"動\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"　\":1},\"赤\":{\"い\":1,\"葦\":2},\"犬\":{\"の\":1,\"（\":1},\"（\":{\"外\":1,\"行\":1,\"か\":1},\"外\":{\"資\":1,\"な\":1,\"と\":1,\"で\":1},\"資\":{\"系\":1},\"系\":{\"）\":1,\"女\":1,\"ま\":1},\"）\":{\"　\":1,\"「\":1,\"逢\":1,\"を\":1},\"肥\":{\"後\":1},\"後\":{\"で\":1,\"ま\":1,\"か\":1},\"緑\":{\"ナ\":1},\"ナ\":{\"ン\":2,\"雪\":1},\"バ\":{\"ー\":2,\"ニ\":1,\"ス\":2,\"レ\":1,\"イ\":1,\"ン\":1,\"シ\":1},\"屋\":{\"さ\":1,\"も\":1},\"勤\":{\"め\":1},\"め\":{\"\":1,\"の\":2,\"に\":60,\"て\":7,\"ら\":2,\"た\":1,\"で\":1,\"・\":1,\"な\":2,\"雑\":1,\"ず\":1,\"せ\":1},\"\\n\":{\"く\":1,\"ス\":1},\"訳\":{\"の\":1,\"\":1},\"記\":{\"号\":1,\"さ\":1,\"録\":2,\"憶\":1},\"号\":{\"を\":1,\"は\":1},\"連\":{\"呼\":1,\"の\":1,\"載\":1},\"呼\":{\"す\":1},\"当\":{\"邪\":1,\"分\":1,\"代\":1,\"に\":1},\"邪\":{\"魔\":1},\"魔\":{\"に\":1},\"害\":{\"は\":1},\"像\":{\"と\":1,\"\":2,\"を\":3,\"も\":1,\"が\":1,\"や\":1},\"上\":{\"げ\":1,\"\":1,\"手\":1,\"は\":1},\"げ\":{\"ま\":1,\"て\":1},\"車\":{\"輪\":1,\"が\":1},\"輪\":{\"の\":1},\"川\":{\"之\":3},\"之\":{\"江\":3},\"江\":{\"中\":3},\"中\":{\"高\":4,\"の\":2,\"本\":1,\"心\":2,\"\":2,\"尉\":1,\"/\":1,\"に\":2,\"で\":1,\"国\":1},\"生\":{\"の\":5,\"に\":2,\"を\":60,\"き\":59,\"ま\":1,\"\":2,\"達\":1,\"態\":2},\"カ\":{\"ウ\":10,\"で\":1,\"\":2,\"ッ\":1,\"メ\":1,\"テ\":1,\"ー\":1},\"ウ\":{\"ン\":10,\"ザ\":2},\"気\":{\"に\":11,\"持\":1,\"軽\":5,\"分\":2,\"ww\":1,\"ま\":1,\"者\":1,\"が\":1},\"bot\":{\"遊\":1,\"で\":2},\"遊\":{\"び\":1},\"び\":{\"と\":1,\"YUNHO＆CHANGMIN\":1,\"完\":1},\"実\":{\"況\":1,\"は\":1},\"況\":{\"が\":1},\"主\":{\"目\":1,\"催\":1,\"に\":1},\"的\":{\"の\":1,\"名\":1,\"に\":2,\"新\":2,\"大\":2,\"曲\":1,\"追\":1,\"代\":1},\"趣\":{\"味\":3},\"味\":{\"ア\":1,\"わ\":1,\"用\":1,\"が\":1,\"し\":3,\"で\":1},\"成\":{\"人\":4,\"一\":1},\"人\":{\"済\":3,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"は\":10,\"生\":61,\"の\":4,\"に\":3,\"気\":2,\"で\":2,\"を\":2,\"腐\":1,\"へ\":1,\"か\":1,\"な\":1,\"間\":1,\"\":1,\"い\":1,\"们\":2,\"指\":1,\"权\":1},\"済\":{\"♀\":1,\"腐\":2},\"♀\":{\"。\":1},\"時\":{\"\":2,\"に\":2,\"や\":1,\"追\":1,\"ふ\":1},\"々TL\":{\"お\":1},\"騒\":{\"が\":1},\"率\":{\"低\":1},\"低\":{\"い\":1},\"Ｆ／Ｂ\":{\"ご\":1},\"自\":{\"由\":3,\"誓\":1,\"分\":62,\"己\":1},\"由\":{\"に\":1,\"\":1,\"，\":1},\"ス\":{\"パ\":1,\"ー\":1,\"ト\":5,\"ポ\":1,\"や\":1,\"/\":1,\"マ\":3,\"を\":1,\"情\":1,\"ゴ\":2,\"世\":1,\"イ\":2,\"ニ\":1,\"テ\":1,\"の\":1},\"パ\":{\"ム\":1,\"ー\":1,\"レ\":2,\"ン\":1},\"！[HOT]K[\":{\"ア\":1},\"メ\":{\"]\":1,\"\":1,\"カ\":1,\"知\":1,\"の\":1},\"]\":{\"タ\":1,\"冲\":1,\"内\":1,\"声\":1},\"/Ｋ/\":{\"薄\":1},\"薄\":{\"桜\":1},\"桜\":{\"鬼\":1},\"鬼\":{\"/\":1},\"ガ\":{\"ン\":1,\"も\":1},\"進\":{\"撃\":3},\"撃\":{\"[\":1,\"/\":1,\"\":1},\"[\":{\"小\":1,\"漫\":1,\"他\":1},\"小\":{\"説\":1,\"森\":1},\"説\":{\"]\":1,\"も\":1,\"を\":1},\"冲\":{\"方\":1},\"丁\":{\"/\":1},\"森\":{\"博\":1,\"隼\":1},\"博\":{\"嗣\":1},\"嗣\":{\"[\":1},\"漫\":{\"画\":2},\"内\":{\"藤\":1,\"容\":4},\"藤\":{\"泰\":1},\"泰\":{\"弘\":1},\"弘\":{\"/\":1},\"河\":{\"ゆ\":1},\"他\":{\"]\":1,\"好\":1,\"に\":1},\"声\":{\"優\":2},\"優\":{\"/\":1,\"さ\":1},\"演\":{\"劇\":2},\"劇\":{\"※@sano_bot1\":1,\"団\":1,\"\":1},\"※@sano_bot1\":{\"二\":1},\"二\":{\"代\":2,\"十\":1},\"代\":{\"目\":2,\"わ\":1,\"表\":2,\"红\":1},\"管\":{\"理\":1},\"理\":{\"人\":1,\"想\":1,\"解\":2},\"コ\":{\"ン\":2,\"ピ\":2,\"イ\":1,\"レ\":2,\"ん\":1,\"ナ\":1,\"動\":1},\"兄\":{\"さ\":1},\"！\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2,\"自\":1,\"応\":1,\"\\r\\n\":63,\"新\":1,\"飛\":1,\"こ\":1,\"な\":1,\"で\":1,\"キ\":1,\"イ\":1,\"マ\":1,\"】⇒\":1,\"」\":2,\"い\":1,\"随\":1,\"【\":1},\"ﾟ\":{\".＊97line\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\".＊97line\":{\"お\":1},\"貢\":{\"い\":1},\"女\":{\"子\":10,\"の\":2,\"を\":1,\"そ\":1,\"性\":1},\"＊.゜\":{\"DISH//\":1},\"DISH//\":{\"✯\":1},\"✯\":{\"佐\":1,\"読\":1,\"WEGO\":1,\"嵐\":1},\"佐\":{\"野\":1},\"悠\":{\"斗\":1},\"斗\":{\"✯\":1},\"WEGO\":{\"✯\":1},\"嵐\":{\"I\":1,\"が\":1,\"好\":1,\"と\":1},\"I\":{\"met\":1,\"surprise\":1},\"met\":{\"@OTYOfficial\":1},\"@OTYOfficial\":{\"in\":1},\"in\":{\"the\":1},\"the\":{\"London\":1},\"London\":{\";)\":1},\";)\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"2310*basketball#41*UVERworld*Pooh☪Bell\":{\"+.\":1},\"+.\":{\"｡\":1},\"｡\":{\"*\":1},\"*\":{\"弱\":1,\"ﾟ\":1},\"弱\":{\"さ\":1,\"虫\":1},\"知\":{\"っ\":6,\"り\":1,\"ら\":7,\"識\":1},\"強\":{\"く\":1},\"宮\":{\"本\":1},\"本\":{\"武\":1,\"音\":3,\"人\":1,\"物\":1,\"試\":1,\"的\":1,\"気\":1,\"の\":1,\"一\":1,\"身\":1,\"推\":1,\"当\":1,\"は\":1},\"武\":{\"蔵\":1,\"田\":1},\"蔵\":{\"の\":1},\"誓\":{\"書\":1},\"「\":{\"獨\":1,\"チ\":1,\"ラ\":1,\"生\":1,\"非\":3,\"九\":1,\"そ\":2,\"も\":1,\"お\":3,\"機\":1,\"い\":1,\"ほ\":1,\"現\":1,\"え\":2,\"こ\":1,\"あ\":1},\"獨\":{\"行\":1},\"行\":{\"道\":1,\"機\":1,\"こ\":1,\"動\":1,\"政\":2},\"」\":{\"に\":1,\"の\":1,\"を\":3,\"\\r\\n\":2,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":2,\"今\":1,\"\\r\\nmore\":1,\"こ\":1,\"が\":1,\"っ\":3,\"て\":1,\"夜\":1,\"詳\":1,\"　\":1,\"と\":4},\"十\":{\"一\":1},\"一\":{\"箇\":1,\"杯\":58,\"読\":2,\"つ\":1,\"部\":1,\"覧\":1,\"途\":1,\"度\":1,\"緒\":1,\"致\":3,\"种\":1},\"箇\":{\"条\":1},\"条\":{\"を\":1,\"件\":1},\"ダ\":{\"ム\":2,\"ー\":1,\"ス\":1,\"ル\":1},\"テ\":{\"モ\":1,\"男\":1,\"ア\":1,\"ゴ\":1,\"ィ\":1,\"る\":1,\"度\":1,\"ム\":2,\"キ\":1,\"リ\":1},\"男\":{\"子\":2,\"バ\":1,\"性\":3,\"の\":1,\"女\":2},\"分\":{\"を\":2,\"が\":58,\"の\":2,\"も\":1,\"に\":2,\"野\":1,\"な\":1,\"子\":1},\"磨\":{\"く\":1},\"ヒ\":{\"ン\":2},\"け\":{\"た\":6,\"し\":64,\"ど\":2,\"て\":5,\"で\":5,\"ま\":8,\"中\":1,\"る\":2,\"TL\":1,\"ん\":1,\"ら\":1,\"家\":1},\"応\":{\"援\":7,\"\":1},\"援\":{\"し\":4,\"よ\":1,\"す\":1,\"本\":1},\"&\":{\"相\":90,\"フ\":17},\"互\":{\"フ\":91},\"♪\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":38,\"\\r\\n\":77,\"気\":1,\"い\":1,\"面\":2,\"た\":1,\"　\":1},\"幸\":{\"せ\":118},\"周\":{\"り\":58},\"\\r\\n\":{\"そ\":68,\"い\":64,\"面\":9,\"公\":1,\"庶\":1,\"ラ\":1,\"気\":8,\"特\":1,\"着\":1,\"デ\":2,\"考\":1,\"お\":5,\"少\":2,\"使\":2,\"み\":1,\"「\":7,\"他\":1,\"同\":1,\"ス\":1,\"ジ\":1,\"ミ\":1,\"ウ\":1,\"ど\":1,\"ヤ\":1,\"【\":1,\"あ\":1,\"可\":1,\"わ\":2,\"本\":1,\"意\":1,\"私\":1,\"女\":1,\"思\":1,\"食\":1,\"タ\":1,\"知\":1,\"人\":1,\"見\":1,\"美\":1,\"今\":1},\"精\":{\"一\":58,\"英\":1},\"杯\":{\"生\":58,\"\":2},\"必\":{\"要\":58,\"ず\":1,\"読\":1,\"然\":1},\"要\":{\"な\":58,\"素\":1},\"葉\":{\"を\":58,\"の\":1},\"届\":{\"け\":65},\"格\":{\"言\":1},\"心\":{\"や\":1,\"あ\":1,\"で\":1,\"の\":1,\"に\":1},\"瞬\":{\"時\":1},\"重\":{\"み\":1},\"面\":{\"白\":11,\"を\":1,\"が\":1},\"白\":{\"か\":11},\"F1.GP2.Superformula.SuperGT.F3...\":{\"\\n\":1},\"GT\":{\"が\":1},\"♡\":{\"車\":1,\"Respect\":1,\"欲\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"新\":{\"幹\":1,\"党\":1,\"闻\":2},\"幹\":{\"線\":1},\"線\":{\"も\":1,\"で\":1,\"か\":1},\"飛\":{\"行\":1},\"機\":{\"も\":1,\"能\":2},\"別\":{\"ア\":1,\"な\":1,\"世\":1,\"で\":1},\"(๑´ㅂ`๑)♡*.+゜\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"ヂ\":{\"ス\":1},\"ポ\":{\"ー\":2,\"ケ\":1},\"ツ\":{\"タ\":1,\"イ\":8,\"ボ\":1,\"ッ\":1,\"っ\":1,\"に\":1},\"ヤ\":{\"\":1,\"の\":2,\"供\":1,\"バ\":1,\"ー\":1},\"「POTENZA\":{\"」\":1},\"ピ\":{\"オ\":1,\"ー\":1,\"ソ\":2,\"ペ\":1},\"オ\":{\"ン\":3,\"ー\":1,\"モ\":1,\"シ\":1},\"称\":{\"号\":1},\"譲\":{\"ら\":1},\"給\":{\"チ\":1},\"全\":{\"力\":2,\"う\":1,\"国\":1,\"滅\":1,\"員\":1},\"力\":{\"で\":2,\"を\":1,\"于\":1},\"返\":{\"信\":1,\"し\":1,\"事\":1},\"信\":{\"が\":1,\"し\":1},\"場\":{\"合\":1,\"す\":1,\"面\":2},\"了\":{\"承\":1,\"検\":1,\"怎\":1},\"承\":{\"よ\":1},\"致\":{\"し\":3,\"通\":1,\"”\":2,\"力\":1},\"え\":{\"な\":2,\"の\":2,\"る\":9,\"さ\":1,\"キ\":1,\"て\":3,\"っ\":1,\"た\":1,\"～\":1,\"置\":1,\"し\":1},\"ホ\":{\"ン\":1,\"に\":2},\"持\":{\"わ\":1},\"銀\":{\"魂\":1},\"魂\":{\"/\":1},\"黒\":{\"バ\":1},\"/BLEACH/\":{\"う\":1},\"鈴\":{\"木\":1},\"木\":{\"達\":1},\"達\":{\"央\":1,\"に\":1,\"の\":1},\"央\":{\"さ\":1},\"神\":{\"谷\":1,\"は\":1,\"起\":2},\"谷\":{\"浩\":1},\"浩\":{\"史\":1},\"史\":{\"さ\":1},\"軽\":{\"に\":5,\"い\":1},\"（＾∇＾）✨\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"HQ!!\":{\"成\":2},\"腐\":{\"女\":5,\"・\":1,\"の\":1},\"多\":{\"い\":2,\"め\":3,\"に\":1,\"く\":1},\"葦\":{\"京\":2},\"京\":{\"治\":2,\"介\":1},\"治\":{\"夢\":2},\"夢\":{\"豚\":2,\"く\":1,\"を\":1},\"豚\":{\"ク\":2},\"ソ\":{\"ツ\":2,\"ー\":2},\"含\":{\"み\":2},\"注\":{\"意\":4,\"目\":1},\"意\":{\"\":3,\"味\":1,\"を\":1,\"外\":2,\"见\":1},\"考\":{\"え\":3},\"際\":{\"は\":2},\"。FRB\":{\"お\":2},\"ね\":{\"ん\":1,\"\":2,\"ww\":1,\"～♪\":1,\"♪\":1,\"～\":1},\"（＾ω＾）\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"見\":{\"つ\":18,\"て\":7,\"間\":1,\"え\":1,\"た\":1,\"る\":1},\"物\":{\"関\":1,\"た\":1,\"と\":1,\"の\":1},\"関\":{\"連\":1,\"西\":1,\"東\":1},\"@sachi_dears\":{\"(\":1},\"(\":{\"さ\":1,\"ヘ\":1,\"歴\":1,\"基\":1,\"同\":1},\"❷)\":{\"も\":1},\"『\":{\"心\":1,\"絶\":1},\"皆\":{\"\":1},\"情\":{\"を\":1,\"に\":1,\"報\":2,\"\":1},\"感\":{\"じ\":1,\"動\":2},\"じ\":{\"な\":1,\"境\":1,\"込\":1},\"べ\":{\"き\":2,\"く\":1,\"た\":2},\"』\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"連\":1,\"公\":1},\"山\":{\"中\":2},\"用\":{\"ア\":1,\"と\":1,\"が\":1,\"す\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"間\":{\"\":1,\"違\":1,\"に\":2,\"で\":1},\"選\":{\"挙\":1,\"法\":1,\"手\":1},\"挙\":{\"啓\":1},\"啓\":{\"発\":1},\"発\":{\"用\":1,\"http://t.co/96UqoCo0oU\":1,\"信\":1,\"想\":2},\"使\":{\"っ\":4,\"え\":2},\"@assam_yamanaka\":{\"の\":1},\"確\":{\"認\":2},\"認\":{\"下\":1,\"及\":1},\"下\":{\"さ\":1,\"ネ\":1},\"公\":{\"選\":1,\"式\":8,\"开\":1},\"法\":{\"に\":1,\"分\":1,\"上\":1},\"係\":{\"る\":1},\"表\":{\"示\":1,\"情\":1,\"現\":1,\"，\":1,\"任\":1},\"示\":{\"\":1},\"庶\":{\"民\":1},\"民\":{\"新\":1},\"党\":{\"#\":1,\"派\":1},\"#\":{\"脱\":1,\"I\":1},\"脱\":{\"原\":1},\"原\":{\"発\":1},\"http://t.co/96UqoCo0oU\":{\"\\r\\nonestep.revival@gmail.com\":1},\"\\r\\nonestep.revival@gmail.com\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"度\":{\"が\":1,\"UP\":1,\"わ\":1},\"素\":{\"敵\":5,\"あ\":1},\"敵\":{\"な\":5},\"ペ\":{\"ア\":1,\"禁\":1,\"ッ\":1,\"ダ\":1},\"紹\":{\"介\":4},\"介\":{\"し\":4,\"\":1},\"～\":{\"す\":1,\"と\":1,\"っ\":3,\"」\":1,\"懐\":1,\"知\":1},\"♥\":{\"」\":1,\"ほ\":1,\"モ\":1,\"そ\":1},\"ァ\":{\"ン\":3},\"容\":{\"ば\":1,\"を\":1,\"の\":1,\"だ\":1},\"ば\":{\"か\":1,\"な\":2,\"い\":1,\"も\":1},\"集\":{\"め\":6},\"欲\":{\"し\":2,\"望\":1},\"特\":{\"別\":1},\"着\":{\"る\":1,\"て\":1},\"ド\":{\"レ\":2,\"サ\":1,\"で\":2,\"な\":1,\"は\":1,\"を\":1,\"ギ\":1,\"！\":1,\"ラ\":1},\"ふ\":{\"と\":1,\"う\":1,\"れ\":1},\"ず\":{\"キ\":1,\"役\":1,\"笑\":2,\"ら\":1,\"耳\":1,\"\":1,\"言\":1},\"デ\":{\"ィ\":4,\"ー\":1,\"ジ\":1,\"イ\":2},\"ィ\":{\"ズ\":2,\"を\":1,\"ー\":1,\"は\":1,\"ダ\":1},\"報\":{\"\":1,\"を\":1},\"深\":{\"い\":1},\"込\":{\"め\":2},\"々\":{\"し\":2,\"、\":1,\"探\":1,\"家\":1},\"風\":{\"刺\":1},\"刺\":{\"画\":1},\"ほ\":{\"し\":1,\"ん\":3},\"ROM\":{\"っ\":1},\"楽\":{\"し\":4},\"数\":{\"多\":1,\"が\":1,\"通\":1},\"非\":{\"推\":1,\"公\":7,\"RT\":6},\"推\":{\"奨\":1,\"言\":1},\"奨\":{\"で\":1},\"早\":{\"兵\":1,\"く\":1},\"兵\":{\"・\":1,\"部\":2,\"庫\":1,\"攻\":1},\"受\":{\"け\":1,\"“\":1},\"BLNL\":{\"な\":1},\"地\":{\"雷\":1},\"雷\":{\"少\":1},\"少\":{\"な\":1,\"年\":1,\"し\":3},\"雑\":{\"多\":1,\"学\":2,\"食\":1},\"呟\":{\"き\":1,\"く\":1,\"い\":1},\"R18\":{\"・\":1},\"有\":{\"る\":1,\"名\":1},\"参\":{\"照\":1},\"照\":{\"願\":1},\"催\":{\"→@chounou_antholo\":1,\"さ\":1},\"→@chounou_antholo\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"家\":{\"\":2,\"具\":2,\"財\":1,\"の\":1,\"に\":1},\"週\":{\"刊\":1},\"刊\":{\"少\":1},\"絶\":{\"対\":3},\"対\":{\"可\":1,\")\":1,\"象\":2,\"に\":1},\"可\":{\"憐\":1,\"愛\":1,\"能\":1},\"憐\":{\"チ\":1},\"載\":{\"中\":1,\"禁\":1,\"は\":1},\"。TV\":{\"ア\":1},\"『THE\":{\"UNLIMITED\":1},\"UNLIMITED\":{\"兵\":1},\"式\":{\"サ\":1,\"bot\":1,\"ア\":4,\"野\":2,\"RT\":1,\"Bot\":1},\"＞http://t.co/jVqBoBEc\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"普\":{\"通\":1,\"段\":1},\"通\":{\"の\":1,\"过\":2},\"ょ\":{\"っ\":1,\"う\":4},\"変\":{\"態\":1,\"え\":1},\"態\":{\"チ\":1,\"を\":2},\"笑\":{\"え\":3,\"っ\":2,\"\":1},\"ぐ\":{\"18\":1,\"に\":1,\"る\":1,\"役\":1,\"\":1},\"簡\":{\"単\":1},\"単\":{\"な\":1},\"会\":{\"話\":2,\"に\":1,\"い\":1,\"变\":1},\"話\":{\"を\":1,\"題\":1,\"し\":1},\"づ\":{\"つ\":1},\"練\":{\"習\":1},\"習\":{\"し\":1,\"性\":1},\"☆\":{\"\\r\\n\":5,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"ザ\":{\"と\":1,\"す\":1,\"い\":1,\"ー\":1},\"困\":{\"っ\":1},\"役\":{\"に\":2,\"立\":1},\"立\":{\"つ\":3},\"秘\":{\"密\":1},\"密\":{\"を\":1},\"surprise\":{\"even\":1},\"even\":{\"my\":1},\"my\":{\"self\":1},\"self\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"解\":{\"け\":1,\"説\":1,\"す\":1,\"で\":1},\"題\":{\"を\":1,\"の\":2,\"は\":1},\"G\":{\"パ\":1},\"A\":{\"型\":1},\"型\":{\"K\":1,\"の\":2},\"K\":{\"月\":1},\"克\":{\"己\":1},\"己\":{\"中\":1,\"満\":1},\"尉\":{\"の\":1},\"七\":{\"巻\":1},\"巻\":{\"と\":1,\"が\":1},\"八\":{\"巻\":1},\"台\":{\"詞\":3},\"詞\":{\"を\":1,\"追\":1,\"や\":1},\"4/18.\":{\"台\":1},\"追\":{\"加\":3,\"求\":2},\"加\":{\"し\":2,\"中\":1},\"現\":{\"在\":4,\"は\":1},\"在\":{\"試\":1,\"軽\":1,\"活\":1,\"BOT\":1},\"試\":{\"運\":1,\"験\":1},\"運\":{\"転\":1},\"転\":{\"中\":1,\"載\":2},\"挨\":{\"拶\":1},\"拶\":{\"だ\":1},\"反\":{\"応\":1,\"对\":1},\"。/\":{\"追\":1},\"何\":{\"お\":1,\"か\":1,\"を\":1,\"国\":1},\"所\":{\"が\":1},\"DM\":{\"や\":1},\"ww\":{\"　\":1,\"\\r\\n\":1},\"～♪\":{\"\\r\\n\":3},\"、BL～\":{\"萌\":1},\"萌\":{\"え\":1},\"同\":{\"じ\":1,\"業\":1},\"境\":{\"遇\":1},\"遇\":{\"の\":1},\"来\":{\"る\":1},\"術\":{\"!!\":1},\"!!\":{\"見\":1,\"応\":1,\"　\":1},\"探\":{\"し\":5,\"そ\":1},\"ゴ\":{\"イ\":2,\"リ\":1},\"エ\":{\"ピ\":2,\"ン\":1,\"ル\":1},\"是\":{\"非\":6,\"人\":1,\"“\":1,\"精\":1,\"意\":1},\"＆\":{\"フ\":8},\"＼\":{\"も\":1},\"歳\":{\"“Only\":1},\"“Only\":{\"One”\":1},\"One”\":{\"に\":1},\"LINE\":{\"で\":1},\"ぎ\":{\"て\":2,\"る\":2},\"ミ\":{\"サ\":3},\"ワ\":{\"的\":1,\"画\":1,\"を\":1,\"ー\":2},\"名\":{\"言\":1,\"人\":1,\"場\":1},\"ボ\":{\"に\":1,\"ッ\":1},\"ｗ\":{\"と\":1,\"\\r\\n\":1},\"昔\":{\"は\":1},\"若\":{\"か\":1},\"想\":{\"像\":1,\"い\":1,\"力\":1,\"の\":1,\"を\":1},\"THE\":{\"SECOND/\":1},\"SECOND/\":{\"劇\":1},\"団\":{\"EXILE/EXILE/\":1},\"EXILE/EXILE/\":{\"二\":1},\"JSB\":{\"☞KENCHI.AKIRA.\":1},\"☞KENCHI.AKIRA.\":{\"青\":1},\"青\":{\"柳\":1},\"柳\":{\"翔\":1},\"翔\":{\".\":1},\".\":{\"小\":1,\"石\":1,\"た\":1,\"戸\":1},\"隼\":{\".\":1},\"石\":{\"井\":1},\"井\":{\"杏\":1},\"杏\":{\"奈\":1},\"奈\":{\"☜\":1},\"☜\":{\"Big\":1},\"Big\":{\"Love\":1},\"Love\":{\"♡\":1},\"Respect\":{\".....\":1},\".....\":{\"✍\":1},\"✍\":{\"MATSU\":1},\"MATSU\":{\"Origin✧\":1},\"Origin✧\":{\".\":1},\"''\":{\"い\":1,\"け\":1},\"TEAM\":{\"NACS\":1},\"NACS\":{\"安\":1},\"安\":{\"田\":1},\"田\":{\".\":1,\"舞\":1},\"戸\":{\"次\":1},\"次\":{\"Liebe\":1},\"Liebe\":{\"!\":1},\"!\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"Yahoo\":{\"オ\":1},\"ョ\":{\"ン\":1},\"商\":{\"品\":1},\"品\":{\"を\":1},\"抽\":{\"出\":1},\"出\":{\"す\":1,\"場\":1,\"会\":1},\"世\":{\"の\":1,\"界\":4},\"録\":{\"が\":1,\"を\":1},\"ギ\":{\"ネ\":1,\"タ\":2,\"ュ\":1},\"界\":{\"記\":1,\"の\":1,\"を\":1,\"的\":1},\"友\":{\"達\":1},\"紫\":{\"宝\":1},\"宝\":{\"勢\":1},\"勢\":{\"の\":1},\"末\":{\"席\":1},\"席\":{\"く\":1},\"QMA\":{\"や\":1},\"\\r\\n9/13（\":{\"土\":1},\"土\":{\"）\":1},\"九\":{\"州\":1},\"州\":{\"杯\":1},\"宜\":{\"し\":1},\"\\r\\nmore\":{\"→\":1},\"→\":{\"http://t.co/ezuHyjF4Qy\":1,\"9/23-28\":1},\"http://t.co/ezuHyjF4Qy\":{\"\\r\\n\":1},\"【\":{\"旅\":1,\"無\":1,\"必\":1,\"お\":1},\"旅\":{\"の\":1},\"予\":{\"定\":1},\"定\":{\"\":1},\"】9/20-22\":{\"関\":1},\"9/23-28\":{\"北\":1},\"北\":{\"海\":1},\"海\":{\"道\":1},\"庫\":{\"県\":1},\"県\":{\"で\":1},\"開\":{\"催\":1},\"甲\":{\"子\":1},\"園\":{\"\":1},\"国\":{\"高\":1,\"的\":1,\"家\":1},\"軟\":{\"式\":2},\"権\":{\"大\":1},\"南\":{\"関\":1},\"東\":{\"ブ\":1,\"方\":2},\"三\":{\"浦\":1},\"浦\":{\"学\":1},\"苑\":{\"軟\":1},\"閉\":{\"じ\":1},\"危\":{\"険\":1},\"険\":{\"な\":1},\"守\":{\"り\":1,\"”\":1},\"私\":{\"が\":1,\"の\":1,\"に\":1,\"っ\":1,\"も\":1,\"目\":1,\"と\":1},\"聞\":{\"い\":1},\"残\":{\"っ\":1,\"る\":1},\"へ\":{\"届\":1},\"絡\":{\"ん\":1},\"！（≧∇≦）\":{\"BF(\":1},\"BF(\":{\"仮\":1},\"仮\":{\"）\":1},\"逢\":{\"坂\":1},\"坂\":{\"紘\":1},\"紘\":{\"夢\":1},\"熱\":{\"で\":1},\"望\":{\"の\":1},\"食\":{\"♡\":1,\"べ\":2},\"☆～（ゝ\":{\"。∂）\":1},\"。∂）\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"段\":{\"は\":1},\"建\":{\"前\":1,\"築\":2,\"”\":1},\"前\":{\"と\":1,\"向\":1},\"!?\":{\"\\r\\n\":3,\"」\":1},\"色\":{\"鉛\":1},\"鉛\":{\"筆\":1},\"筆\":{\"な\":1},\"～？\":{\"\\r\\n\":1},\"違\":{\"え\":1},\"程\":{\"の\":1},\"御\":{\"覧\":1,\"用\":1},\"覧\":{\"く\":1,\"：\":1},\"政\":{\"書\":1,\"法\":1},\"士\":{\"の\":1},\"験\":{\"問\":1,\"を\":1},\"過\":{\"去\":1},\"去\":{\"問\":1},\"随\":{\"時\":2},\"基\":{\"本\":3,\"準\":1},\"。※140\":{\"字\":1},\"字\":{\"制\":1,\"数\":1},\"制\":{\"限\":1},\"限\":{\"の\":1},\"都\":{\"合\":1,\"市\":1},\"文\":{\"字\":1},\"能\":{\"で\":1,\"一\":1,\"\":1},\"領\":{\"域\":1},\"域\":{\"に\":1},\"！？\":{\"\\r\\n\":1,\"　\":1},\"裏\":{\"側\":1},\"側\":{\"を\":1},\"作\":{\"ろ\":1,\"っ\":1,\"り\":2},\"断\":{\"転\":1,\"り\":1},\"禁\":{\"止\":3},\"止\":{\"･\":1,\"・\":1,\"\":1},\"･\":{\"コ\":1},\"】\":{\"【\":1,\"り\":1},\"】⇒\":{\"http://t.co/nuUvfUVD\":1},\"http://t.co/nuUvfUVD\":{\"今\":1},\"活\":{\"動\":1},\"YUNHO＆CHANGMIN\":{\"の\":1,\"を\":1},\"!!(^_-)-☆\":{\"※\":1},\"※\":{\"東\":1},\"及\":{\"び\":2},\"鍵\":{\"付\":1},\"付\":{\"ユ\":1,\"け\":2},\"ユ\":{\"ー\":1},\"歌\":{\"う\":1},\"翻\":{\"訳\":1},\"セ\":{\"サ\":1,\"レ\":1},\"、……\":{\"何\":1},\"雪\":{\"が\":1},\"hack\":{\"と\":1},\"弾\":{\"い\":1},\"ケ\":{\"モ\":1,\"ー\":1},\"\\nSPRING\":{\"WATER\":1},\"WATER\":{\"リ\":1},\"ヘ\":{\"ル\":1},\")\":{\"\\nROCK\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1,\"ゾ\":1},\"\\nROCK\":{\"OUT\":1},\"OUT\":{\"レ\":1},\"DJ\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"耳\":{\"を\":1},\"疑\":{\"う\":1},\"性\":{\"の\":2,\"♥\":1,\"像\":1,\"に\":1,\"を\":1},\"壊\":{\"し\":1},\"ぁ\":{\"\":1},\"６\":{\"秒\":1},\"秒\":{\"動\":1},\"⁽⁽٩(\":{\"ᐖ\":1},\"ᐖ\":{\")۶⁾⁾\":1},\")۶⁾⁾\":{\"❤︎\":1},\"❤︎\":{\"武\":1,\"₍₍٩(\":1},\"舞\":{\"彩\":1},\"彩\":{\"❤︎\":1},\"₍₍٩(\":{\"ᐛ\":1},\"ᐛ\":{\")۶₎₎\":1},\")۶₎₎\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"。@ringo_BDFFLOVE\":{\"←\":1},\"←\":{\"は\":1},\"妹\":{\"で\":1},\"BOT\":{\"で\":1},\"、BDFF\":{\"の\":1},\"夜\":{\"は\":1},\"滅\":{\"\":1},\"「BDFF\":{\"プ\":1},\"！(\":{\"絶\":1},\"ProjectDIVA\":{\"の\":1},\"×\":{\"鏡\":1},\"鏡\":{\"音\":1},\"FutureStyle\":{\"の\":1},\"満\":{\"足\":1},\"足\":{\"非\":1},\"Bot\":{\"　\":1},\"仕\":{\"様\":1},\"様\":{\"\":1,\"に\":1,\"を\":1},\"。CP\":{\"要\":1},\"美\":{\"味\":3,\"女\":1},\"仲\":{\"間\":2},\"cambiando\":{\"la\":1},\"la\":{\"vida\":1},\"vida\":{\"de\":1},\"de\":{\"las\":1},\"las\":{\"personas.\":1},\"personas.\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"異\":{\"性\":1},\"然\":{\"的\":1},\"●●\":{\"」\":1},\"者\":{\"に\":1,\"様\":1},\"UP\":{\"の\":1},\"ぞ\":{\"れ\":1},\"驚\":{\"く\":1},\"ビ\":{\"シ\":1,\"ン\":2,\"\":1,\"♡usj\":1},\"伝\":{\"わ\":1,\"説\":1,\"え\":1},\"究\":{\"極\":1},\"極\":{\"の\":1},\"ONE\":{\"PIECE\":1},\"PIECE\":{\"愛\":1},\"２３\":{\"ち\":1},\"歴\":{\"１４\":1},\"１４\":{\"年\":1},\"ゾ\":{\"ロ\":2},\"途\":{\"だ\":1},\"件\":{\"に\":1},\"♡usj\":{\"、\":1},\"、H\":{\"x\":1},\"x\":{\"H\":1},\"H\":{\"も\":1},\"♩\":{\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"豊\":{\"富\":1},\"富\":{\"で\":1},\"恋\":{\"愛\":2},\"経\":{\"験\":1},\"ェ\":{\"ア\":1},\"誰\":{\"に\":1},\"憶\":{\"に\":1},\"懐\":{\"か\":1},\"求\":{\"め\":1,\"“\":1,\"本\":1},\"緒\":{\"に\":1},\"？\":{\"か\":1},\"～！\":{\"知\":1},\"識\":{\"を\":1},\"住\":{\"む\":1},\"む\":{\"部\":1},\"w\":{\"　\":1},\"闻\":{\"，\":1,\"\":1},\"，\":{\"世\":1,\"当\":1,\"人\":1,\"反\":1,\"也\":2,\"本\":1},\"LDH\":{\"フ\":1},\"員\":{\"仲\":1},\"怖\":{\"す\":1},\"市\":{\"伝\":1},\"ww]\":{\"」\":1},\"ぼ\":{\"し\":1},\"ゅ\":{\"\":1},\"〜\":{\"〜(\":1,\"MARKOV_SENTENCE_END_KEY_01$#@%^#\":1},\"〜(\":{\"っ\":1},\"˘ω˘c\":{\")＊\":1},\")＊\":{\"日\":1},\"具\":{\"（\":1,\"の\":1,\"類\":2,\"は\":1},\"、Furniture）\":{\"は\":1},\"財\":{\"道\":1},\"据\":{\"え\":1},\"置\":{\"い\":1,\"か\":1},\"利\":{\"用\":1},\"比\":{\"較\":2},\"較\":{\"的\":2},\"類\":{\"\":1,\"を\":1},\"築\":{\"基\":1,\"確\":1},\"準\":{\"法\":1},\"完\":{\"了\":1},\"検\":{\"査\":1},\"査\":{\"の\":1},\"象\":{\"と\":1,\"外\":1,\"\":1},\"君\":{\"の\":1},\"瞳\":{\"に\":1},\"僕\":{\"に\":1},\"乾\":{\"杯\":1},\"ぬ\":{\"が\":1},\"仏\":{\"な\":1},\"经\":{\"历\":1},\"历\":{\"了\":1},\"怎\":{\"样\":1},\"样\":{\"的\":1},\"曲\":{\"折\":1},\"折\":{\"才\":1},\"才\":{\"从\":1},\"从\":{\"追\":1},\"“\":{\"一\":2,\"过\":1,\"基\":1,\"封\":1},\"过\":{\"”\":1,\"半\":1,\"”，\":1},\"”\":{\"发\":1,\"甚\":1,\"的\":2,\"、“\":2},\"发\":{\"展\":1},\"展\":{\"到\":1},\"到\":{\"今\":1,\"对\":1},\"天\":{\"人\":1},\"们\":{\"接\":1,\"认\":1},\"接\":{\"受\":1},\"半\":{\"数\":1},\"”，\":{\"正\":1},\"正\":{\"是\":1,\"确\":1},\"认\":{\"识\":1},\"识\":{\"到\":1},\"对\":{\"“\":1,\"象\":1,\"网\":1},\"甚\":{\"至\":1},\"至\":{\"是\":1},\"身\":{\"就\":1},\"就\":{\"会\":1},\"变\":{\"成\":1},\"种\":{\"独\":1},\"独\":{\"裁\":1},\"裁\":{\"\":1},\"被\":{\"人\":1},\"指\":{\"责\":1},\"责\":{\"“\":1},\"封\":{\"建\":1,\"锁\":1},\"、“\":{\"落\":1,\"保\":1},\"落\":{\"后\":1},\"后\":{\"”\":1},\"保\":{\"守\":1},\"红\":{\"卫\":1},\"卫\":{\"兵\":1},\"攻\":{\"击\":1},\"击\":{\"对\":1},\"于\":{\"言\":1},\"论\":{\"自\":1,\"不\":1},\"权\":{\"；\":1},\"；\":{\"倡\":1},\"倡\":{\"导\":1},\"导\":{\"资\":1},\"资\":{\"讯\":1},\"讯\":{\"公\":1},\"开\":{\"，\":1},\"网\":{\"络\":1},\"络\":{\"封\":1},\"锁\":{\"\":1},\"既\":{\"不\":1},\"不\":{\"是\":2,\"代\":1,\"标\":1},\"英\":{\"分\":1},\"也\":{\"不\":2},\"见\":{\"领\":1},\"领\":{\"袖\":1},\"袖\":{\"，\":1},\"任\":{\"何\":1},\"派\":{\"和\":1},\"和\":{\"组\":1,\"正\":1},\"组\":{\"织\":1},\"织\":{\"，\":1},\"标\":{\"榜\":1},\"榜\":{\"伟\":1},\"伟\":{\"大\":1},\"光\":{\"荣\":1},\"荣\":{\"和\":1},\"确\":{\"\":1},\"踊\":{\"り\":1},\"嬉\":{\"し\":1},\"ざ\":{\"い\":1},\"ぽ\":{\"っ\":1},\"向\":{\"き\":1},\"頑\":{\"張\":1},\"張\":{\"る\":1},\"虫\":{\"ペ\":1},\"ぷ\":{\"(\":1},\")”○”\":{\"　DM\":1},\"　DM\":{\"(\":1},\"業\":{\"者\":1},\"除\":{\"い\":1},\")”×”\":{\"　\":1},\"→http://t.co/8E91tqoeKX\":{\"　\":1}}"
        ) as Record<string, Record<string, number>>;
}
/* eslint-enable */
