import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { parseSprResponse, SPR_MAX_CHARS_NEGATIVE } from '@shared/grading';
import type { Question } from '@shared/types';

import { MathText } from '@/components/math-text';
import { Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Stimulus, stem and answer input for one question. `checked` is null while answering; once set,
 * MC choices show right/wrong. Pass `reveal={false}` (diagnostic) to never show the key.
 */
export function QuestionView({
  q,
  response,
  onResponse,
  checked,
  reveal = true,
}: {
  q: Question;
  response: number | string | null;
  onResponse: (r: number | string | null) => void;
  checked: boolean | null;
  reveal?: boolean;
}) {
  const theme = useTheme();
  const locked = checked !== null;
  const spr = typeof response === 'string' && response ? parseSprResponse(response) : null;
  return (
    <>
      {q.stimulus && (
        <View style={[styles.stimulus, { borderColor: theme.backgroundSelected }]}>
          <MathText>{q.stimulus}</MathText>
        </View>
      )}
      <MathText style={{ fontSize: 18, fontWeight: '600' }}>{q.stem}</MathText>

      {q.choices ? (
        q.choices.map((c, i) => (
          <Choice
            key={i}
            label={String.fromCharCode(65 + i)}
            text={c}
            selected={response === i}
            status={!locked || !reveal ? null : i === q.answer ? 'correct' : response === i ? 'wrong' : null}
            onPress={() => !locked && onResponse(i)}
          />
        ))
      ) : (
        <View style={{ gap: 6 }}>
          <TextInput
            editable={!locked}
            value={typeof response === 'string' ? response : ''}
            onChangeText={(t) => onResponse(t || null)}
            placeholder="Your answer"
            maxLength={SPR_MAX_CHARS_NEGATIVE}
            autoCorrect={false}
            keyboardType="numbers-and-punctuation"
            style={[styles.gridIn, { color: theme.text, borderColor: theme.backgroundSelected }]}
          />
          {spr && !spr.ok && <Text style={{ color: Brand.wrong, fontWeight: '600' }}>{spr.reason}</Text>}
        </View>
      )}
    </>
  );
}

function Choice({
  label,
  text,
  selected,
  status,
  onPress,
}: {
  label: string;
  text: string;
  selected: boolean;
  status: 'correct' | 'wrong' | null;
  onPress: () => void;
}) {
  const theme = useTheme();
  const border = status === 'correct' ? Brand.correct : status === 'wrong' ? Brand.wrong : selected ? Brand.primary : theme.backgroundSelected;
  return (
    <Pressable onPress={onPress} style={[styles.choice, { borderColor: border, borderBottomWidth: 4 }]}>
      <View style={[styles.choiceLabel, { borderColor: border }]}>
        <Text style={{ color: border === theme.backgroundSelected ? theme.textSecondary : border, fontWeight: '800' }}>{label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <MathText>{text}</MathText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stimulus: { borderWidth: 2, borderRadius: 14, padding: 12 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderRadius: 14, padding: 12 },
  choiceLabel: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  gridIn: { borderWidth: 2, borderRadius: 14, padding: 14, fontSize: 20, fontWeight: '700' },
});
