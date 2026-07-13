import { useEffect, useState } from 'react';
import { Eye, Layers3, Minus, Play, Plus, RotateCcw, Settings2, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog.jsx';
import { OFFICIAL_GAME_VISUAL_CONFIG } from '@/services/gameVisualConfigService.js';
import {
  PLAYGROUND_ACTIONS,
  applyPlaygroundAction,
  createAction,
  createInitialPlaygroundState,
  mainPlayerId,
  mockCards,
} from '../GamePlayground/playgroundEngine.js';
import { ClassicTableView } from './ClassicTableView.jsx';

const STORAGE_KEY = 'ohhell:game-playground-classic:v1';
const profileLabels = { desktop: 'Desktop', mobilePortrait: 'Mobile portrait', mobileLandscape: 'Mobile landscape' };

function cloneProfiles() {
  return Object.fromEntries(Object.entries(OFFICIAL_GAME_VISUAL_CONFIG).map(([key, value]) => [key, { ...value, showGuides: false }]));
}

function loadSnapshot() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed?.state) return null;
    return { state: parsed.state };
  } catch { return null; }
}

function NumericControl({ label, value, onChange, min = 0, max = 20, step = 1 }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-zinc-400">{label}</span>
      <span className="flex items-center gap-2">
        <Button type="button" size="icon-sm" variant="outline" aria-label={`Diminuir ${label}`} onClick={() => onChange(Math.max(min, Number(value) - step))}><Minus /></Button>
        <input type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-2 text-center text-sm font-bold text-white outline-none focus:border-amber-300/70" />
        <Button type="button" size="icon-sm" variant="outline" aria-label={`Aumentar ${label}`} onClick={() => onChange(Math.min(max, Number(value) + step))}><Plus /></Button>
      </span>
    </label>
  );
}

function SelectField({ label, value, onChange, children }) {
  return <label className="grid gap-1.5"><span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-zinc-400">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm font-semibold text-white outline-none focus:border-amber-300/70">{children}</select></label>;
}

function Section({ icon: Icon, title, children }) {
  return <section className="grid min-w-0 gap-4 rounded-2xl border border-white/10 bg-black/25 p-4"><div className="flex items-center gap-2 text-sm font-black text-amber-100"><Icon className="size-4 text-amber-300" /><h3>{title}</h3></div>{children}</section>;
}

function VisualControls({ config, onChange, onReset }) {
  const field = (label, key, min, max, step = 1) => <NumericControl key={key} label={label} min={min} max={max} step={step} value={config[key] ?? 0} onChange={(value) => onChange(key, value)} />;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Section icon={Eye} title="Mesa e jogadores">
        {field('Mesa', 'tableScale', .6, 1.4, .05)}
        {field('Centro e deck', 'centerScale', .5, 1.6, .05)}
        {field('Centro X (%)', 'centerOffsetX', -60, 60)}
        {field('Centro Y (%)', 'centerOffsetY', -60, 60)}
        {field('Boxes', 'seatScale', .5, 1.6, .05)}
        {field('Órbita horizontal', 'seatOrbitX', 10, 48)}
        {field('Órbita vertical', 'seatOrbitY', 8, 44)}
        {field('Elevação do player', 'seatLift', 0, 14)}
      </Section>
      <Section icon={Settings2} title="Controles e área inferior">
        {field('Bid', 'bidControlScale', .5, 1.8, .05)}
        {field('Bid X (%)', 'bidControlOffsetX', -70, 70)}
        {field('Bid Y (%)', 'bidControlOffsetY', -70, 70)}
        {field('Mão clássica', 'classicHandScale', .5, 1.6, .05)}
        {field('Caixa das cartas: altura (vh)', 'classicHandAreaHeightVh', 0, 60)}
        {field('Caixa das cartas: largura (vw)', 'classicHandBoxWidthVw', 0, 100)}
        {field('Caixa das cartas X (%)', 'classicHandBoxOffsetX', -50, 50)}
        {field('Caixa das cartas Y (%)', 'classicHandBoxOffsetY', -50, 50)}
        {field('Mão clássica X (%)', 'classicHandOffsetX', -70, 70)}
        {field('Mão clássica Y (%)', 'classicHandOffsetY', -50, 50)}
        {field('Timer', 'timerScale', .5, 1.8, .05)}
        {field('Timer X (%)', 'timerOffsetX', -70, 70)}
        {field('Timer Y (%)', 'timerOffsetY', -70, 70)}
      </Section>
      <Section icon={Layers3} title="Informações e guias">
        {field('Painel de info', 'tableInfoScale', .5, 1.8, .05)}
        {field('Painel info X (%)', 'tableInfoOffsetX', -70, 70)}
        {field('Painel info Y (%)', 'tableInfoOffsetY', -70, 70)}
        <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-zinc-200">Guias de posicionamento<input type="checkbox" checked={config.showGuides || false} onChange={(event) => onChange('showGuides', event.target.checked)} /></label>
        <Button type="button" variant="outline" onClick={onReset}><RotateCcw /> Restaurar perfil central</Button>
      </Section>
    </div>
  );
}

export function GamePlaygroundClassic() {
  const [snapshot, setSnapshot] = useState(() => loadSnapshot() || ({ state: createInitialPlaygroundState() }));
  const [visualConfigs, setVisualConfigs] = useState(cloneProfiles);
  const [shouldPersistVisualConfig, setShouldPersistVisualConfig] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] = useState(mainPlayerId);
  const [selectedClassicCardId, setSelectedClassicCardId] = useState(mockCards.classicCards[0].id);
  const [newPlayerName, setNewPlayerName] = useState('Novo player');
  const [controlTab, setControlTab] = useState('actions');
  const [controlsOpen, setControlsOpen] = useState(false);
  const [animationCard, setAnimationCard] = useState(null);

  const { state } = snapshot;
  const selectedPlayer = state.players.find((player) => player.id === selectedPlayerId) || state.players[0];
  const activeProfile = controlTab in visualConfigs ? controlTab : 'desktop';
  const visualConfig = visualConfigs[activeProfile];

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ state })); }, [state]);
  useEffect(() => { if (!state.players.some((player) => player.id === selectedPlayerId)) setSelectedPlayerId(mainPlayerId); }, [selectedPlayerId, state.players]);
  useEffect(() => {
    if (!shouldPersistVisualConfig || !import.meta.env.DEV) return undefined;

    const controller = new AbortController();
    const persist = async () => {
      try {
        const response = await fetch('/__dev/game-visual-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(visualConfigs),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error('Não foi possível salvar a configuração central.');
        setSaveError('');
      } catch (error) {
        if (error.name !== 'AbortError') setSaveError(error.message || 'Não foi possível salvar a configuração central.');
      }
    };
    void persist();
    return () => controller.abort();
  }, [shouldPersistVisualConfig, visualConfigs]);

  const dispatch = (type, payload = {}) => setSnapshot((current) => ({ ...current, state: applyPlaygroundAction(current.state, createAction(type, payload)) }));
  const updateVisual = (key, value) => {
    setVisualConfigs((current) => ({ ...current, [activeProfile]: { ...current[activeProfile], [key]: value } }));
    setShouldPersistVisualConfig(true);
  };
  const resetVisualProfile = () => {
    setVisualConfigs((current) => ({ ...current, [activeProfile]: { ...OFFICIAL_GAME_VISUAL_CONFIG[activeProfile], showGuides: false } }));
    setShouldPersistVisualConfig(true);
  };
  const playCard = (card) => { setAnimationCard(card); dispatch(PLAYGROUND_ACTIONS.PLAY_CLASSIC_CARD, { playerId: mainPlayerId, cardId: card.id }); };

  return (
    <main className="min-h-screen overflow-hidden bg-zinc-950 text-white">
      <header className="mx-auto flex w-[min(96%,118rem)] flex-wrap items-center justify-between gap-3 py-4">
        <div><p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-amber-300/80">Fodinha Classic</p><h1 className="text-2xl font-black tracking-tight text-white">Game visual playground</h1></div>
        <Button type="button" onClick={() => setControlsOpen(true)}><Settings2 /> Controles</Button>
      </header>
      <div className="mx-auto w-[min(96%,118rem)] pb-5"><ClassicTableView animationCard={animationCard} animationDuration={visualConfig.animationDuration} onAnimationEnd={() => setAnimationCard(null)} onBid={(bid) => dispatch(PLAYGROUND_ACTIONS.CHANGE_BID, { playerId: mainPlayerId, amount: bid - (state.players.find((player) => player.id === mainPlayerId)?.bid || 0) })} onClassicPlay={playCard} pile={state.pile} players={state.players} selectedPlayerId={mainPlayerId} showGuides={visualConfig.showGuides} upcard={state.upcard} visualConfig={visualConfig} /></div>
      <Dialog open={controlsOpen} onOpenChange={setControlsOpen}>
        <DialogContent overlayClassName="!bg-transparent !backdrop-blur-none supports-backdrop-filter:!backdrop-blur-none" className="left-auto right-0 top-0 h-screen max-h-screen w-[min(34rem,100vw)] max-w-none translate-x-0 translate-y-0 gap-5 overflow-y-auto rounded-none border-y-0 border-r-0 border-l-amber-200/20 bg-zinc-950 p-4 text-white sm:max-w-none sm:p-6">
          <DialogHeader><DialogTitle className="text-xl font-black text-amber-100">Controle visual do Fodinha Classic</DialogTitle><DialogDescription className="text-zinc-400">No ambiente de desenvolvimento, cada ajuste é salvo no arquivo central e refletido em /game.</DialogDescription></DialogHeader>
          {saveError ? <p className="rounded-lg border border-red-300/30 bg-red-950/30 px-3 py-2 text-sm text-red-100">{saveError}</p> : null}
          <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
            <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${controlTab === 'actions' ? 'bg-white/10 text-white' : 'text-zinc-400'}`} onClick={() => setControlTab('actions')}>Ações</button>
            {Object.keys(profileLabels).map((profile) => <button key={profile} type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${controlTab === profile ? 'bg-white/10 text-white' : 'text-zinc-400'}`} onClick={() => setControlTab(profile)}>{profileLabels[profile]}</button>)}
          </div>
          {controlTab === 'actions' ? <div className="grid gap-5">
            <Section icon={Users} title="Player selecionado">
              <SelectField label="Box alvo" value={selectedPlayerId} onChange={setSelectedPlayerId}>{state.players.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}</SelectField>
              <div className="grid gap-4 sm:grid-cols-3"><NumericControl label="Vida" value={selectedPlayer?.lifes || 0} onChange={(value) => dispatch(PLAYGROUND_ACTIONS.CHANGE_LIFE, { playerId: selectedPlayerId, amount: value - (selectedPlayer?.lifes || 0) })} /><NumericControl label="Bids" value={selectedPlayer?.bid || 0} onChange={(value) => dispatch(PLAYGROUND_ACTIONS.CHANGE_BID, { playerId: selectedPlayerId, amount: value - (selectedPlayer?.bid || 0) })} /><NumericControl label="Pontos" value={selectedPlayer?.points || 0} onChange={() => {}} /></div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]"><input value={newPlayerName} onChange={(event) => setNewPlayerName(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none" /><Button type="button" variant="outline" onClick={() => { dispatch(PLAYGROUND_ACTIONS.ADD_PLAYER, { playerId: `player-${Date.now()}`, nickname: newPlayerName || 'Novo player' }); setNewPlayerName('Novo player'); }}><UserPlus /> Adicionar box</Button></div>
              {selectedPlayerId !== mainPlayerId ? <Button type="button" variant="destructive" onClick={() => dispatch(PLAYGROUND_ACTIONS.REMOVE_PLAYER, { playerId: selectedPlayerId })}><Trash2 /> Remover box</Button> : null}
            </Section>
            <Section icon={Layers3} title="Cartas clássicas">
              <SelectField label="Carta" value={selectedClassicCardId} onChange={setSelectedClassicCardId}>{mockCards.classicCards.map((card) => <option key={card.id} value={card.id}>{card.rank} de {card.suit}</option>)}</SelectField>
              <div className="grid gap-3 sm:grid-cols-3"><Button type="button" onClick={() => dispatch(PLAYGROUND_ACTIONS.ADD_CLASSIC_CARD, { playerId: selectedPlayerId, cardId: selectedClassicCardId })}><Plus /> Adicionar</Button><Button type="button" variant="outline" onClick={() => dispatch(PLAYGROUND_ACTIONS.REMOVE_CLASSIC_CARD, { playerId: selectedPlayerId, cardId: selectedClassicCardId })}><Minus /> Remover</Button><Button type="button" variant="outline" onClick={() => playCard(mockCards.classicCards.find((card) => card.id === selectedClassicCardId))}><Play /> Jogar</Button></div>
              <Button type="button" variant="outline" onClick={() => dispatch(PLAYGROUND_ACTIONS.SHUFFLE_CLASSIC_DECK)}><RotateCcw /> Embaralhar deck</Button>
            </Section>
          </div> : <VisualControls config={visualConfig} onChange={updateVisual} onReset={resetVisualProfile} />}
        </DialogContent>
      </Dialog>
    </main>
  );
}
