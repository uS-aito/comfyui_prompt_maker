import { useState } from 'react'
import { useAppContext } from '../../state/AppContext'
import type { Environment } from '../../types/environment'

export function GlobalSettingsPanel() {
  const { state, dispatch } = useAppContext()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const { environments, globalSettings } = state
  const { characterName, selectedEnvironment } = globalSettings

  const handleCharacterNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_CHARACTER_NAME', payload: e.target.value })
  }

  const handleToggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev)
  }

  const handleSelectEnvironment = (env: Environment) => {
    dispatch({ type: 'SELECT_ENVIRONMENT', payload: env })
    setIsDropdownOpen(false)
  }

  const triggerAriaLabel = selectedEnvironment
    ? `環境: ${selectedEnvironment.displayName}`
    : '環境を選択'

  return (
    <div>
      {/* キャラクター名入力 */}
      <div>
        <label htmlFor="character-name">キャラクター名</label>
        <input
          id="character-name"
          type="text"
          value={characterName}
          onChange={handleCharacterNameChange}
          placeholder="キャラクター名を入力"
        />
      </div>

      {/* 環境選択ドロップダウン */}
      <div>
        <span>環境</span>
        <div style={{ position: 'relative' }}>
          <button
            onClick={handleToggleDropdown}
            aria-label={triggerAriaLabel}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            {selectedEnvironment ? (
              <>
                {selectedEnvironment.thumbnailUrl && (
                  <img
                    src={selectedEnvironment.thumbnailUrl}
                    alt=""
                    aria-hidden="true"
                    style={{ width: 24, height: 24, objectFit: 'cover' }}
                  />
                )}
                <span>{selectedEnvironment.displayName}</span>
              </>
            ) : (
              <span>環境を選択</span>
            )}
          </button>

          {isDropdownOpen && (
            <ul role="listbox" aria-label="環境一覧" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {environments.map((env) => (
                <li
                  key={env.name}
                  role="option"
                  aria-label={env.displayName}
                  aria-selected={selectedEnvironment?.name === env.name}
                  onClick={() => handleSelectEnvironment(env)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  {env.thumbnailUrl ? (
                    <img
                      src={env.thumbnailUrl}
                      alt={env.displayName}
                      style={{ width: 40, height: 40, objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{ width: 40, height: 40, background: '#eee' }}
                      aria-hidden="true"
                    />
                  )}
                  <span>{env.displayName}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
