/**
 * What the spirits say during a fight, and how they say it. Each spirit has a mood, which picks
 * the shape of its speech bubble (fukidashi), and a few lines for the moments that matter.
 */
import type { SpiritId } from './spirits';

/** The bubble shape: dotted, round, cloud, burst, dark spikes, or icicles. */
export type Mood = 'whisper' | 'playful' | 'sly' | 'shout' | 'menace' | 'cold';

export type VoiceMoment =
  /** Its stop lands a hit on you. */
  | 'hit'
  /** You strike it and it survives. */
  | 'hurt'
  /** It calls koi-koi. */
  | 'koikoi'
  /** You call koi-koi. */
  | 'playerKoikoi'
  /** You win the fight. */
  | 'calmed'
  /** You're taking a long time over your turn. */
  | 'idle'
  /** Its boss rule fires (a stolen Bright, an earthquake, a disguise seen through, a freeze). */
  | 'rule';

export interface SpiritVoice {
  readonly mood: Mood;
  readonly lines: Partial<Record<VoiceMoment, readonly string[]>>;
}

/** How long your turn can sit before an impatient spirit says something (at normal speed). */
export const IDLE_TAUNT_MS = 12000;

/** How long a line stays on screen. */
export const SPEECH_MS = 2800;

export const VOICES: Record<SpiritId, SpiritVoice> = {
  kodama: {
    mood: 'whisper',
    lines: {
      hit: ['…the pines took that…', '…echo… echo…'],
      hurt: ['…the branches creak…', '…ah… the wind…'],
      koikoi: ['…again… again…'],
      playerKoikoi: ['…brave… brave…'],
      calmed: ['…the forest… is quiet…'],
      idle: ['…the pines are still waiting…'],
    },
  },
  zashikiWarashi: {
    mood: 'playful',
    lines: {
      hit: ['Ha! Mine now!', 'Coins, coins, coins!'],
      hurt: ['Hey! No fair!', 'Ow! Again, again!'],
      koikoi: ['One more round! One more!'],
      playerKoikoi: ["Ooh, you're brave!"],
      calmed: ['Fine! Keep the coins… this time.'],
      idle: ['Your tuuurn! Hurry up!', 'Are you asleep?'],
    },
  },
  kasaObake: {
    mood: 'playful',
    lines: {
      hit: ['*hop* Got you!', 'Splish splash!'],
      hurt: ['My spokes!', '*wobble wobble*'],
      koikoi: ['*hop hop* More!'],
      playerKoikoi: ['Ooh, a gambler!'],
      calmed: ['*folds up quietly*'],
      idle: ['*hop* *hop* *hop*… well?', "It'll rain before you move."],
    },
  },
  chochinObake: {
    mood: 'sly',
    lines: {
      hit: ['So warm… give me more.', 'Your light tastes lovely.'],
      hurt: ["You'll put me out!", 'Mind the flame!'],
      koikoi: ['Brighter… brighter…'],
      playerKoikoi: ['Burning so bright for me?'],
      calmed: ['The wick… is out…'],
      idle: ['I can wait. I have all night.'],
    },
  },
  kawauso: {
    mood: 'playful',
    lines: {
      hit: ['The river wins again!', 'Double or dry, friend!'],
      hurt: ['Oof! Slippery one, you.', "Fair's fair. Again?"],
      koikoi: ['What could go wrong?'],
      playerKoikoi: ["Now you're playing!"],
      calmed: ['Good game! Next time, by the river.'],
      idle: ["The water's getting cold…"],
    },
  },
  hitotsumeKozo: {
    mood: 'sly',
    lines: {
      hit: ['Saw that coming.', 'Told you. I see everything.'],
      hurt: ['I saw that too! …Ow.'],
      koikoi: ["I've seen your hand. I'm not worried."],
      playerKoikoi: ['Brave. I can see your cards, remember?'],
      calmed: ["Didn't see that one coming."],
      idle: ["I already know what you'll play."],
    },
  },
  bakeneko: {
    mood: 'sly',
    lines: {
      hit: ['Mrrow. Mine.', 'Purr… that one was delicious.'],
      hurt: ['Hssss!', "You'll pay for that. Nine times."],
      koikoi: ['More. Always more.'],
      playerKoikoi: ['Greedy little mouse.'],
      calmed: ['…Fine. I was bored anyway.'],
      idle: ["*yawns* Wake me when you've decided."],
    },
  },
  ittanMomen: {
    mood: 'whisper',
    lines: {
      hit: ['…wrapped… so tight…', "…you're tangled now…"],
      hurt: ['…torn… torn…'],
      koikoi: ['…longer… longer still…'],
      playerKoikoi: ["…you'll trip on that…"],
      calmed: ['…flutters away…'],
      idle: ['…dusk is coming…'],
    },
  },
  // The Faceless One says nothing at all, until the very end.
  nopperabo: {
    mood: 'whisper',
    lines: {
      hit: ['…'],
      hurt: ['…!'],
      koikoi: ['……'],
      playerKoikoi: ['…?'],
      calmed: ['…thank you…'],
      idle: ['…'],
    },
  },
  // Always stops at once, so it never calls koi-koi.
  kamaitachi: {
    mood: 'shout',
    lines: {
      hit: ['Snikt!', 'Too slow!'],
      hurt: ['Grr! Lucky!', 'Cheap cut!'],
      playerKoikoi: ['Waiting? I never wait!'],
      calmed: ['The wind… dies…'],
      idle: ['Hurry! HURRY!', 'Quick cuts! Move!'],
    },
  },
  rokurokubi: {
    mood: 'menace',
    lines: {
      hit: ['I told you. I reach everything.', 'Closer… closer…'],
      hurt: ['My neck! …How rude.'],
      koikoi: ['Let me stretch this out a little.'],
      playerKoikoi: ["I'll be right over your shoulder."],
      calmed: ['Dawn already? Back to ordinary.'],
      idle: ["I'm right behind you. Look."],
    },
  },
  yamauba: {
    mood: 'sly',
    lines: {
      hit: ["There, there. That didn't hurt.", "Eat up, dear. You're looking thin."],
      hurt: ['Ungrateful child!', "Oh, you'll be tender now."],
      koikoi: ['Another hand, dearie? Sit, sit.'],
      playerKoikoi: ['Staying for supper, then?'],
      calmed: ["The fire's gone out. Off you go."],
      idle: ["Take your time, dear. The pot's still warming."],
    },
  },
  tanuki: {
    mood: 'playful',
    lines: {
      hit: ['Ha-HA! Pay up!', '*BOOM* goes the drum!'],
      hurt: ['Oof! Right in the belly!', 'Lucky! Double or nothing!'],
      koikoi: ['Double or nothing! *boom boom*'],
      playerKoikoi: ["THAT's the spirit! *BOOM*"],
      calmed: ["Heh… you'd make a fine tanuki."],
      idle: ['*drums impatiently*', 'Bet! Bet! Bet!'],
    },
  },
  tengu: {
    mood: 'menace',
    lines: {
      hit: ['Kneel before the mountain.', 'Another light for my hoard.'],
      hurt: ['Insolent!', 'You dare?!'],
      koikoi: ['The mountain is patient. You are not.'],
      playerKoikoi: ['Reach higher. Fall farther.'],
      calmed: ['Take your little lights, then.'],
      rule: ['That light is mine.', 'Mine. Like all the others.'],
    },
  },
  kappa: {
    mood: 'shout',
    lines: {
      hit: ['Washed away!', 'Into the river with you!'],
      hurt: ["My dish! Don't spill my dish!"],
      koikoi: ["The current's rising!"],
      playerKoikoi: ["You'll drown in that!"],
      calmed: ['*bows* …You bowed first. Fine.'],
      idle: ['Cucumber! Got any cucumber?'],
    },
  },
  namazu: {
    mood: 'shout',
    lines: {
      hit: ['RUMBLE!', 'The ground is mine!'],
      hurt: ['THRASH!', 'You tickle the deep!'],
      koikoi: ['Hold on tighter!'],
      playerKoikoi: ["You'll fall with the house!"],
      calmed: ['…the earth settles…'],
      rule: ['HOLD ON TO SOMETHING!'],
    },
  },
  kitsune: {
    mood: 'sly',
    lines: {
      hit: ['Was it ever really yours?', 'Fooled you.'],
      hurt: ['Clever. Or lucky?', 'A trick of the light.'],
      koikoi: ["Keep looking. You'll never be sure."],
      playerKoikoi: ['Are you sure of that?'],
      calmed: ['Nine tails, and still outfoxed.'],
      rule: ['Oh? You saw through that one.'],
    },
  },
  nue: {
    mood: 'shout',
    lines: {
      hit: ['Learned that from you!', 'Again! Show me again!'],
      hurt: ["I'll remember that.", "New trick! I'll learn it."],
      koikoi: ['What else can you do?'],
      playerKoikoi: ["I'm watching. Learning."],
      calmed: ['Nothing left to learn… today.'],
      idle: ["Show me! I'm waiting to learn!"],
    },
  },
  yukiOnna: {
    mood: 'cold',
    lines: {
      hit: ["So cold, isn't it?", 'Rest now. Sleep.'],
      hurt: ['Warm hands. How rude.'],
      koikoi: ['Stay a little longer.'],
      playerKoikoi: ['Yes… stay with me.'],
      calmed: ['Spring comes anyway. It always does.'],
      rule: ['That one is mine now.'],
      idle: ["Getting sleepy? That's the cold."],
    },
  },
  // Never calls koi-koi (its boss rule).
  oni: {
    mood: 'menace',
    lines: {
      hit: ['Paid in full.', 'The club collects.'],
      hurt: ['You pay in the end.', 'Hah! A down payment.'],
      playerKoikoi: ['Borrowing time? The interest is steep.'],
      calmed: ['Debt settled. This year.'],
      idle: ['The interest is growing.'],
    },
  },
};

export function voiceOf(id: SpiritId): SpiritVoice {
  return VOICES[id];
}
