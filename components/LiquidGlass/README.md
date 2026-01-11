# Liquid Glass UI Components 🌊

Beautiful glassmorphism/liquid glass components for React Native with Expo.

**Features:**
- ✨ Native iOS 26+ Liquid Glass support (when available)
- 🔄 Automatic fallback to BlurView for older iOS versions
- 🎨 Smooth animations and haptic feedback
- 📱 Works on all iOS versions and Android

## Components Included

- **GlassToggle** - Animated toggle switches with glass effect
- **GlassButton** - Pressable buttons with haptic feedback
- **GlassCard** - Container cards with native/blur glass effect
- **GlassInput** - Text inputs with glassmorphism styling
- **GlassSlider** - Range sliders with smooth animations

## Installation

These components require the following dependencies:

```bash
# Core dependencies (required)
expo install expo-blur expo-linear-gradient expo-haptics

# Native Liquid Glass (optional, iOS 26+ only)
expo install expo-glass-effect
```

> **Note:** The components will automatically use native iOS 26+ Liquid Glass when available and fall back to `expo-blur` on older versions. Both look great!

## Usage Examples

### GlassToggle

```tsx
import { GlassToggle } from '@/components/LiquidGlass';

const [enabled, setEnabled] = useState(false);

<GlassToggle
  value={enabled}
  onValueChange={setEnabled}
  label="Enable notifications"
  size="medium"
  activeColor="#00d4ff"
/>
```

**Props:**
- `value` (boolean) - Toggle state
- `onValueChange` (function) - Callback when toggled
- `label` (string, optional) - Label text
- `disabled` (boolean, optional) - Disable interaction
- `size` ('small' | 'medium' | 'large') - Toggle size
- `activeColor` (string, optional) - Custom active color

---

### GlassButton

```tsx
import { GlassButton } from '@/components/LiquidGlass';
import { Home } from 'lucide-react-native';

<GlassButton
  title="Get Started"
  icon={Home}
  iconSize={20}
  variant="primary"
  size="large"
  onPress={() => console.log('Pressed!')}
  haptic={true}
  fullWidth
/>
```

**Props:**
- `title` (string, optional) - Button text
- `icon` (LucideIcon, optional) - Icon component
- `iconSize` (number) - Icon size (default: 20)
- `onPress` (function) - Press handler
- `variant` ('primary' | 'secondary' | 'ghost') - Visual style
- `size` ('small' | 'medium' | 'large') - Button size
- `disabled` (boolean) - Disable button
- `loading` (boolean) - Show loading state
- `fullWidth` (boolean) - Take full width
- `haptic` (boolean) - Enable haptic feedback (iOS)

---

### GlassCard

```tsx
import { GlassCard } from '@/components/LiquidGlass';

<GlassCard
  intensity={80}
  tint="dark"
  bordered={true}
  gradient={true}
  pressable={true}
  onPress={() => console.log('Card pressed')}
  className="p-6"
>
  <Text>Your content here</Text>
</GlassCard>
```

**Props:**
- `children` (ReactNode) - Card content
- `intensity` (number) - Blur intensity (default: 80)
- `tint` ('light' | 'dark' | 'default') - Blur tint
- `bordered` (boolean) - Show border (default: true)
- `gradient` (boolean) - Apply gradient overlay
- `pressable` (boolean) - Make card pressable
- `onPress` (function) - Press handler
- `style` (ViewStyle) - Custom styles
- `borderRadius` (number) - Border radius (default: 16)

---

### GlassInput

```tsx
import { GlassInput } from '@/components/LiquidGlass';
import { Mail } from 'lucide-react-native';

<GlassInput
  label="Email Address"
  placeholder="Enter your email"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  icon={<Mail size={20} color="white" />}
  error={emailError}
/>
```

**Props:**
- All standard `TextInput` props, plus:
- `label` (string, optional) - Input label
- `error` (string, optional) - Error message
- `icon` (ReactNode, optional) - Left icon
- `rightIcon` (ReactNode, optional) - Right icon
- `containerClassName` (string) - Container styling

---

### GlassSlider

```tsx
import { GlassSlider } from '@/components/LiquidGlass';

const [value, setValue] = useState(50);

<GlassSlider
  value={value}
  onValueChange={setValue}
  minimumValue={0}
  maximumValue={100}
  step={1}
  label="Volume"
  showValue={true}
  activeColor="#ff3856"
/>
```

**Props:**
- `value` (number) - Current value
- `onValueChange` (function) - Value change handler
- `minimumValue` (number) - Min value (default: 0)
- `maximumValue` (number) - Max value (default: 100)
- `step` (number) - Step increment (default: 1)
- `label` (string, optional) - Slider label
- `showValue` (boolean) - Display current value
- `disabled` (boolean) - Disable slider
- `width` (number) - Slider width (default: 300)
- `height` (number) - Track height (default: 8)
- `thumbSize` (number) - Thumb size (default: 28)
- `activeColor` (string, optional) - Active track color

---

## Integration Examples

### Login Screen with Glass Components

```tsx
import { View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, GlassInput, GlassButton } from '@/components/LiquidGlass';
import { Mail, Lock } from 'lucide-react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <LinearGradient colors={['#1a1a2e', '#16213e']} style={{ flex: 1 }}>
      <View className="flex-1 justify-center p-6">
        <GlassCard className="p-6" gradient>
          <GlassInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            icon={<Mail size={20} color="rgba(255,255,255,0.6)" />}
            containerClassName="mb-4"
          />

          <GlassInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon={<Lock size={20} color="rgba(255,255,255,0.6)" />}
            containerClassName="mb-6"
          />

          <GlassButton
            title="Sign In"
            variant="primary"
            size="large"
            fullWidth
            onPress={() => console.log('Login')}
          />
        </GlassCard>
      </View>
    </LinearGradient>
  );
}
```

### Settings Screen with Toggles and Sliders

```tsx
import { ScrollView } from 'react-native';
import { GlassCard, GlassToggle, GlassSlider } from '@/components/LiquidGlass';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [volume, setVolume] = useState(75);

  return (
    <ScrollView className="flex-1 p-6">
      <GlassCard className="p-6 mb-4" gradient>
        <GlassToggle
          value={notifications}
          onValueChange={setNotifications}
          label="Push Notifications"
          size="medium"
          className="mb-4"
        />

        <GlassToggle
          value={darkMode}
          onValueChange={setDarkMode}
          label="Dark Mode"
          size="medium"
        />
      </GlassCard>

      <GlassCard className="p-6" gradient>
        <GlassSlider
          label="Volume"
          value={volume}
          onValueChange={setVolume}
          minimumValue={0}
          maximumValue={100}
          showValue
        />
      </GlassCard>
    </ScrollView>
  );
}
```

## Styling & Customization

### Background Gradients

For best glass effect, use gradient backgrounds:

```tsx
import { LinearGradient } from 'expo-linear-gradient';

<LinearGradient
  colors={['#1a1a2e', '#16213e', '#0f3460']}
  style={{ flex: 1 }}
>
  {/* Your glass components */}
</LinearGradient>
```

### Theme Colors

Components automatically use your theme colors from `useThemeColors()`:

```tsx
const colors = useThemeColors();
// colors.highlight is used for active states
```

### Custom Styling

Use Tailwind classes or inline styles:

```tsx
<GlassCard className="p-6 m-4" style={{ borderRadius: 24 }}>
  {/* Content */}
</GlassCard>
```

## Best Practices

1. **Performance**: BlurView can be expensive. Avoid nesting too many blur components.

2. **Contrast**: Ensure text has sufficient contrast against blurred backgrounds.

3. **Dark Backgrounds**: Glass effect works best on dark/colorful gradient backgrounds.

4. **Haptics**: Use haptic feedback sparingly for important interactions only.

5. **Accessibility**: Always provide labels and ensure sufficient touch targets (min 44x44).

## Demo

See `GlassShowcase.tsx` for a complete demo of all components.

## Troubleshooting

**Issue**: Components look flat/not blurred
- **Solution**: Ensure you have a gradient or image background. BlurView needs content behind it to blur.

**Issue**: Performance issues
- **Solution**: Reduce `intensity` prop or limit number of BlurViews on screen.

**Issue**: Imports not working
- **Solution**: Use the barrel export:
  ```tsx
  import { GlassToggle, GlassButton } from '@/components/LiquidGlass';
  ```

## License

MIT - Free to use in your projects!
