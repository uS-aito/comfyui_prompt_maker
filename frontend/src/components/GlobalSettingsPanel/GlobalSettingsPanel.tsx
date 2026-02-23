import { useAppContext } from '../../state/AppContext'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

export function GlobalSettingsPanel() {
  const { state, dispatch } = useAppContext()

  const { environments, globalSettings } = state
  const { characterName, selectedEnvironment } = globalSettings

  const handleCharacterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_CHARACTER_NAME', payload: e.target.value })
  }

  const handleSelectEnvironment = (value: string) => {
    const env = environments.find((e) => e.name === value)
    if (env) {
      dispatch({ type: 'SELECT_ENVIRONMENT', payload: env })
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold">グローバル設定</h2>

      {/* キャラクター名入力 */}
      <div className="space-y-1">
        <label htmlFor="character-name" className="text-sm">
          キャラクター名
        </label>
        <Input
          id="character-name"
          type="text"
          value={characterName}
          onChange={handleCharacterNameChange}
          placeholder="キャラクター名を入力"
        />
      </div>

      {/* 環境選択 */}
      <div className="space-y-1">
        <p className="text-sm">環境</p>
        <Select
          value={selectedEnvironment?.name ?? ''}
          onValueChange={handleSelectEnvironment}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="環境を選択" />
          </SelectTrigger>
          <SelectContent>
            {environments.map((env) => (
              <SelectItem key={env.name} value={env.name}>
                <div className="flex items-center gap-2">
                  {env.thumbnailUrl ? (
                    <img
                      src={env.thumbnailUrl}
                      alt={env.displayName}
                      aria-hidden="true"
                      className="h-8 w-8 object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-muted" aria-hidden="true" />
                  )}
                  <span>{env.displayName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
