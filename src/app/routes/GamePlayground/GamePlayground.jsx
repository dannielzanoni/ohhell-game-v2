import { useEffect, useState } from 'react';
import {
  ChevronDown,
  Clock3,
  Code2,
  Eye,
  Layers3,
  Minus,
  Pause,
  PencilRuler,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import hellHandBg from '@/assets/hell_hand/backgrounds/hell-hand-bg.avif';
import { Button } from '@/components/ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { deckTypes } from '@/services/gamePreferencesService.js';
import { GameTableView } from './GameTableView.jsx';
import {
  PLAYGROUND_ACTIONS,
  applyPlaygroundAction,
  createAction,
  createInitialPlaygroundState,
  defaultVisualConfig,
  loadPlaygroundSnapshot,
  mainPlayerId,
  mockCards,
  savePlaygroundSnapshot,
} from './playgroundEngine.js';

const actionLabels = {
  ADD_CLASSIC_CARD: 'Adicionar carta clássica',
  REMOVE_CLASSIC_CARD: 'Remover carta clássica',
  ADD_POWER_CARD: 'Adicionar carta mágica',
  REMOVE_POWER_CARD: 'Remover carta mágica',
  ADD_PLAYER: 'Adicionar player',
  REMOVE_PLAYER: 'Remover box de player',
  CHANGE_BID: 'Alterar bids',
  CHANGE_LIFE: 'Alterar vida',
  CHANGE_MANA: 'Alterar mana',
  PLAY_CLASSIC_CARD: 'Jogar carta clássica',
  PLAY_POWER_CARD: 'Jogar carta mágica',
  SHUFFLE_CLASSIC_DECK: 'Embaralhar deck clássico',
  SHUFFLE_POWER_DECK: 'Embaralhar deck mágico',
  DRAW_POWER_CARD: 'Comprar carta mágica',
};

const defaultSnapshot = {
  state: createInitialPlaygroundState(),
  timeline: [],
  visualConfig: defaultVisualConfig,
};

function delay(duration) {
  return new Promise((resolve) => window.setTimeout(resolve, duration));
}

function NumericControl({ label, value, onChange, min = 0, max = 20, step = 1 }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={`Diminuir ${label}`}
          onClick={() => onChange(Math.max(min, Number(value) - step))}
        >
          <Minus />
        </Button>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/40 px-2 text-center text-sm font-bold text-white outline-none focus:border-amber-300/70"
        />
        <Button
          type="button"
          size="icon-sm"
          variant="outline"
          aria-label={`Aumentar ${label}`}
          onClick={() => onChange(Math.min(max, Number(value) + step))}
        >
          <Plus />
        </Button>
      </div>
    </div>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </span>
      <span className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-3 pr-8 text-sm font-semibold text-white outline-none focus:border-amber-300/70"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
      </span>
    </label>
  );
}

function Section({ className = '', icon: Icon, title, children }) {
  return (
    <section className={`grid min-w-0 gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-black text-amber-100">
        <Icon className="size-4 text-amber-300" />
        <h3>{title}</h3>
      </div>
      {children}
    </section>
  );
}

export function GamePlayground() {
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState(() => loadPlaygroundSnapshot() || defaultSnapshot);
  const [selectedPlayerId, setSelectedPlayerId] = useState(mainPlayerId);
  const [selectedClassicCardId, setSelectedClassicCardId] = useState(mockCards.classicCards[0].id);
  const [selectedPowerCardId, setSelectedPowerCardId] = useState(mockCards.powerCards[0].id);
  const [selectedTargetId, setSelectedTargetId] = useState('player-rival-1');
  const [newPlayerName, setNewPlayerName] = useState('New Player');
  const [mode, setMode] = useState('instant');
  const [controlTab, setControlTab] = useState('actions');
  const [controlsOpen, setControlsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [animationCard, setAnimationCard] = useState(null);
  const [draggingPowerCard, setDraggingPowerCard] = useState(null);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  const { state, timeline, visualConfig } = snapshot;
  const selectedPlayer = state.players.find((player) => player.id === selectedPlayerId) || state.players[0];
  const selectedPowerCard = mockCards.powerCards.find((card) => card.id === selectedPowerCardId);
  const selectedClassicCard = mockCards.classicCards.find((card) => card.id === selectedClassicCardId);
  const responsiveTableScale = visualConfig.tableScale * (isMobile ? 0.8 : 1);
  const responsiveCenterScale = visualConfig.centerScale * (isMobile ? 0.86 : 1);
  const responsiveSeatScale = visualConfig.seatScale * (isMobile ? 0.86 : 1);
  const responsiveClassicHandScale = visualConfig.classicHandScale * (isMobile ? 0.78 : 1);
  const responsivePowerHandScale = visualConfig.powerHandScale * (isMobile ? 0.78 : 1);

  useEffect(() => {
    savePlaygroundSnapshot(snapshot);
  }, [snapshot]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!state.players.some((player) => player.id === selectedPlayerId)) {
      setSelectedPlayerId(mainPlayerId);
    }
    if (!state.players.some((player) => player.id === selectedTargetId && player.id !== selectedPlayerId)) {
      const nextTarget = state.players.find((player) => player.id !== selectedPlayerId);
      setSelectedTargetId(nextTarget?.id || mainPlayerId);
    }
  }, [selectedPlayerId, selectedTargetId, state.players]);

  const updateVisualConfig = (key, value) => {
    setSnapshot((current) => ({
      ...current,
      visualConfig: { ...current.visualConfig, [key]: value },
    }));
  };

  const applyAction = (action) => {
    setSnapshot((current) => ({
      ...current,
      state: applyPlaygroundAction(current.state, action),
    }));
  };

  const dispatchAction = (type, payload = {}) => {
    const action = createAction(type, payload);
    if (mode === 'timeline') {
      setSnapshot((current) => ({ ...current, timeline: [...current.timeline, action] }));
      return;
    }

    applyAction(action);
  };

  const playClassic = (card) => {
    if (mode === 'instant') {
      setAnimationCard(card);
    }
    dispatchAction(PLAYGROUND_ACTIONS.PLAY_CLASSIC_CARD, {
      playerId: mainPlayerId,
      cardId: card.id,
    });
  };

  const playPower = (card) => {
    setAnimationCard(null);
    dispatchAction(PLAYGROUND_ACTIONS.PLAY_POWER_CARD, {
      playerId: mainPlayerId,
      cardId: card.id,
      targetId: card.type === 'targetable' ? selectedTargetId : undefined,
    });
  };

  const runTimeline = async () => {
    if (isRunning || !timeline.length) return;
    setIsRunning(true);
    for (const action of timeline) {
      if (action.type === PLAYGROUND_ACTIONS.PLAY_CLASSIC_CARD) {
        const card = state.players
          .find((player) => player.id === action.playerId)
          ?.classicHand.find((candidate) => candidate.id === action.cardId);
        if (card) setAnimationCard(card);
      }
      applyAction(action);
      await delay(Math.max(0, Number(visualConfig.animationDelay) || 0));
    }
    setSnapshot((current) => ({ ...current, timeline: [] }));
    setIsRunning(false);
  };

  const removeTimelineAction = (id) => {
    setSnapshot((current) => ({
      ...current,
      timeline: current.timeline.filter((action) => action.id !== id),
    }));
  };

  const moveTimelineAction = (index, direction) => {
    setSnapshot((current) => {
      const nextTimeline = [...current.timeline];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= nextTimeline.length) return current;
      [nextTimeline[index], nextTimeline[nextIndex]] = [nextTimeline[nextIndex], nextTimeline[index]];
      return { ...current, timeline: nextTimeline };
    });
  };

  const addPlayer = () => {
    const playerId = `player-${Date.now()}`;
    dispatchAction(PLAYGROUND_ACTIONS.ADD_PLAYER, {
      playerId,
      nickname: newPlayerName || 'New Player',
    });
    setNewPlayerName('New Player');
  };

  const selectedCardActions = selectedPowerCard?.actions || [];

  return (
    <main
      className="min-h-screen overflow-hidden bg-zinc-950 text-white"
      style={{ backgroundImage: `linear-gradient(rgba(7, 7, 10, 0.78), rgba(7, 7, 10, 0.92)), url(${hellHandBg})` }}
    >
      <header className="mx-auto flex w-[min(96%,118rem)] flex-wrap items-center justify-between gap-3 py-4">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.28em] text-amber-300/80">Hell Hand</p>
          <h1 className="text-2xl font-black tracking-tight text-white">Game visual playground</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-100">
            <span className="size-2 rounded-full bg-emerald-300" /> Mock data
          </span>
          <Button type="button" variant="outline" onClick={() => navigate('/hell-hand/workshop')}>
            Workshop
          </Button>
          <Button type="button" onClick={() => setControlsOpen(true)}>
            <Settings2 />
            Controles
          </Button>
        </div>
      </header>

      <div className="mx-auto grid w-[min(96%,118rem)] gap-3 pb-5">
        <GameTableView
          animationCard={animationCard}
          animationDuration={visualConfig.animationDuration}
          bidControlOffsetX={visualConfig.bidControlOffsetX}
          bidControlOffsetY={visualConfig.bidControlOffsetY}
          bidControlScale={visualConfig.bidControlScale}
          draggingPowerCard={draggingPowerCard}
          deckType={deckTypes.SPANISH_8BIT}
          centerScale={responsiveCenterScale}
          centerOffsetX={visualConfig.centerOffsetX}
          centerOffsetY={visualConfig.centerOffsetY}
          classicHandOffsetY={visualConfig.classicHandOffsetY}
          onAnimationEnd={() => setAnimationCard(null)}
          onBid={(bid) => dispatchAction(PLAYGROUND_ACTIONS.CHANGE_BID, {
            playerId: mainPlayerId,
            amount: bid - (state.players.find((player) => player.id === mainPlayerId)?.bid || 0),
          })}
          onClassicPlay={playClassic}
          onPowerCardDragEnd={() => setDraggingPowerCard(null)}
          onPowerCardDragStart={setDraggingPowerCard}
          onPowerCardDrop={(playerId) => {
            if (animationCard) return;
            const card = state.players.find((player) => player.id === mainPlayerId)?.powerHand.find((candidate) => candidate.type === 'targetable');
            if (card) {
              dispatchAction(PLAYGROUND_ACTIONS.PLAY_POWER_CARD, {
                playerId: mainPlayerId,
                cardId: card.id,
                targetId: playerId,
              });
            }
          }}
          onPowerCardDiscard={(cardId) => {
            dispatchAction(PLAYGROUND_ACTIONS.DISCARD_POWER_CARD, {
              playerId: mainPlayerId,
              cardId,
            });
            setDraggingPowerCard(null);
          }}
          onPowerCardPlay={playPower}
          pile={state.pile}
          players={state.players}
          powerDeck={state.powerDeck}
          powerDiscard={state.discardedPowerCards || []}
          powerDeckControlOffsetX={visualConfig.powerDeckControlOffsetX}
          powerDeckControlOffsetY={visualConfig.powerDeckControlOffsetY}
          powerDeckControlScale={visualConfig.powerDeckControlScale}
          onPowerDeckDraw={() => dispatchAction(PLAYGROUND_ACTIONS.DRAW_POWER_CARD, { playerId: mainPlayerId })}
          powerHandScale={responsivePowerHandScale}
          powerHandOffsetX={visualConfig.powerHandOffsetX}
          powerHandOffsetY={visualConfig.powerHandOffsetY}
          selectedPlayerId={mainPlayerId}
          showGuides={visualConfig.showGuides}
          seatScale={responsiveSeatScale}
          seatLift={visualConfig.seatLift}
          seatOrbitX={visualConfig.seatOrbitX}
          seatOrbitY={visualConfig.seatOrbitY}
          tableScale={responsiveTableScale}
          classicHandScale={responsiveClassicHandScale}
          upcard={state.upcard}
        />

        <aside className="hidden">
          <div className="flex items-center gap-2 text-sm font-black text-amber-100">
            <Clock3 className="size-4 text-amber-300" />
            Timeline
          </div>
          <TimelineList timeline={timeline} onRemove={removeTimelineAction} onMove={moveTimelineAction} />
          <div className="grid gap-2">
            <Button type="button" disabled={!timeline.length || isRunning} onClick={() => void runTimeline()}>
              {isRunning ? <Pause /> : <Play />}
              {isRunning ? 'Executando' : 'Executar timeline'}
            </Button>
            <Button type="button" variant="outline" disabled={!timeline.length || isRunning} onClick={() => setSnapshot((current) => ({ ...current, timeline: [] }))}>
              <Trash2 /> Limpar fila
            </Button>
          </div>
        </aside>
      </div>

      <Dialog open={controlsOpen} onOpenChange={setControlsOpen}>
        <DialogContent
          overlayClassName="bg-transparent backdrop-blur-none supports-backdrop-filter:backdrop-blur-none"
          className="left-auto right-0 top-0 h-screen max-h-screen w-[30vw] max-w-none translate-x-0 translate-y-0 gap-5 overflow-y-auto rounded-none border-y-0 border-r-0 border-l-amber-200/20 bg-zinc-950 p-4 text-white sm:max-w-none sm:p-6"
          style={{ maxWidth: '30vw', width: '30vw' }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-black text-amber-100">
              <PencilRuler className="size-5 text-amber-300" />
              Controle visual da mesa
            </DialogTitle>
            <DialogDescription className="text-zinc-400">
              Altere o estado imediatamente ou monte uma sequência para reproduzir a cena.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="hidden">
              <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${mode === 'instant' ? 'bg-amber-300 text-zinc-950' : 'text-zinc-300'}`} onClick={() => setMode('instant')}>Alteração imediata</button>
              <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${mode === 'timeline' ? 'bg-violet-300 text-zinc-950' : 'text-zinc-300'}`} onClick={() => setMode('timeline')}>Adicionar à timeline</button>
            </div>

            <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1 sm:col-span-2">
              <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${controlTab === 'actions' ? 'bg-white/10 text-white' : 'text-zinc-400'}`} onClick={() => setControlTab('actions')}>Ações</button>
              <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${controlTab === 'visual' ? 'bg-white/10 text-white' : 'text-zinc-400'}`} onClick={() => setControlTab('visual')}>Visual e animação</button>
              <button type="button" className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${controlTab === 'json' ? 'bg-white/10 text-white' : 'text-zinc-400'}`} onClick={() => setControlTab('json')}>JSON da carta</button>
            </div>

            {controlTab === 'actions' ? (
              <>
                <Section className="sm:col-span-2" icon={Users} title="Player selecionado">
                  <SelectField label="Box alvo" value={selectedPlayerId} onChange={setSelectedPlayerId}>
                    {state.players.map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <NumericControl label="Vida" value={selectedPlayer?.lifes || 0} onChange={(amount) => dispatchAction(PLAYGROUND_ACTIONS.CHANGE_LIFE, { playerId: selectedPlayerId, amount: amount - (selectedPlayer?.lifes || 0) })} />
                    <NumericControl label="Mana" value={selectedPlayer?.mana?.current || 0} onChange={(amount) => dispatchAction(PLAYGROUND_ACTIONS.CHANGE_MANA, { playerId: selectedPlayerId, amount: amount - (selectedPlayer?.mana?.current || 0) })} />
                    <NumericControl label="Bids" value={selectedPlayer?.bid || 0} onChange={(amount) => dispatchAction(PLAYGROUND_ACTIONS.CHANGE_BID, { playerId: selectedPlayerId, amount: amount - (selectedPlayer?.bid || 0) })} />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto]">
                    <input value={newPlayerName} onChange={(event) => setNewPlayerName(event.target.value)} className="h-9 rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none" />
                    <Button type="button" variant="outline" onClick={addPlayer}><UserPlus /> Adicionar box</Button>
                  </div>
                  {selectedPlayerId !== mainPlayerId ? <Button type="button" variant="destructive" onClick={() => dispatchAction(PLAYGROUND_ACTIONS.REMOVE_PLAYER, { playerId: selectedPlayerId })}><Trash2 /> Remover box</Button> : null}
                </Section>

                <Section className="sm:col-span-2" icon={Layers3} title="Cartas clássicas">
                  <SelectField label="Carta" value={selectedClassicCardId} onChange={setSelectedClassicCardId}>
                    {mockCards.classicCards.map((card) => <option key={card.id} value={card.id}>{card.rank} de {card.suit}</option>)}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button type="button" onClick={() => dispatchAction(PLAYGROUND_ACTIONS.ADD_CLASSIC_CARD, { playerId: selectedPlayerId, cardId: selectedClassicCardId })}><Plus /> Adicionar</Button>
                    <Button type="button" variant="outline" onClick={() => dispatchAction(PLAYGROUND_ACTIONS.REMOVE_CLASSIC_CARD, { playerId: selectedPlayerId, cardId: selectedClassicCardId })}><Minus /> Remover</Button>
                  </div>
                  <Button type="button" variant="outline" onClick={() => dispatchAction(PLAYGROUND_ACTIONS.SHUFFLE_CLASSIC_DECK)}><RotateCcw /> Embaralhar deck</Button>
                </Section>

                <Section className="sm:col-span-2" icon={Sparkles} title="Cartas mágicas">
                  <SelectField label="Carta" value={selectedPowerCardId} onChange={setSelectedPowerCardId}>
                    {mockCards.powerCards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}
                  </SelectField>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button type="button" onClick={() => dispatchAction(PLAYGROUND_ACTIONS.ADD_POWER_CARD, { playerId: selectedPlayerId, cardId: selectedPowerCardId })}><Plus /> Adicionar</Button>
                    <Button type="button" variant="outline" onClick={() => dispatchAction(PLAYGROUND_ACTIONS.REMOVE_POWER_CARD, { playerId: selectedPlayerId, cardId: selectedPowerCardId })}><Minus /> Remover</Button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button type="button" onClick={() => playPower(selectedPowerCard)}><Play /> Jogar</Button>
                    <Button type="button" variant="outline" onClick={() => dispatchAction(PLAYGROUND_ACTIONS.DRAW_POWER_CARD, { playerId: mainPlayerId })}><Plus /> Comprar</Button>
                  </div>
                  {selectedPowerCard?.type === 'targetable' ? <SelectField label="Alvo da carta" value={selectedTargetId} onChange={setSelectedTargetId}>{state.players.filter((player) => player.id !== mainPlayerId).map((player) => <option key={player.id} value={player.id}>{player.nickname}</option>)}</SelectField> : null}
                  <Button type="button" variant="outline" onClick={() => dispatchAction(PLAYGROUND_ACTIONS.SHUFFLE_POWER_DECK)}><RotateCcw /> Embaralhar deck mágico</Button>
                </Section>
              </>
            ) : null}

            {controlTab === 'visual' ? (
              <div className="grid gap-5 sm:col-span-2 sm:grid-cols-2">
                <Section icon={Eye} title="Escala da mesa">
                  <NumericControl label="Mesa" min={0.7} max={1.2} step={0.05} value={visualConfig.tableScale} onChange={(value) => updateVisualConfig('tableScale', value)} />
                  <NumericControl label="Centro e decks" min={0.6} max={1.4} step={0.05} value={visualConfig.centerScale} onChange={(value) => updateVisualConfig('centerScale', value)} />
                  <NumericControl label="Centro e decks X (%)" min={-40} max={40} step={1} value={visualConfig.centerOffsetX} onChange={(value) => updateVisualConfig('centerOffsetX', value)} />
                  <NumericControl label="Centro e decks Y (%)" min={-40} max={40} step={1} value={visualConfig.centerOffsetY} onChange={(value) => updateVisualConfig('centerOffsetY', value)} />
                  <NumericControl label="Boxes" min={0.6} max={1.4} step={0.05} value={visualConfig.seatScale} onChange={(value) => updateVisualConfig('seatScale', value)} />
                  <NumericControl label="Seleção de bid (%)" min={0.6} max={1.6} step={0.05} value={visualConfig.bidControlScale} onChange={(value) => updateVisualConfig('bidControlScale', value)} />
                  <NumericControl label="Seleção de bid X (%)" min={-50} max={50} step={1} value={visualConfig.bidControlOffsetX} onChange={(value) => updateVisualConfig('bidControlOffsetX', value)} />
                  <NumericControl label="Seleção de bid Y (%)" min={-50} max={50} step={1} value={visualConfig.bidControlOffsetY} onChange={(value) => updateVisualConfig('bidControlOffsetY', value)} />
                  <NumericControl label="Deck mágico (%)" min={0.5} max={1.8} step={0.05} value={visualConfig.powerDeckControlScale} onChange={(value) => updateVisualConfig('powerDeckControlScale', value)} />
                  <NumericControl label="Deck mágico X (%)" min={-100} max={100} step={1} value={visualConfig.powerDeckControlOffsetX} onChange={(value) => updateVisualConfig('powerDeckControlOffsetX', value)} />
                  <NumericControl label="Deck mágico Y (%)" min={-100} max={100} step={1} value={visualConfig.powerDeckControlOffsetY} onChange={(value) => updateVisualConfig('powerDeckControlOffsetY', value)} />
                  <NumericControl label="Mão clássica" min={0.6} max={1.4} step={0.05} value={visualConfig.classicHandScale} onChange={(value) => updateVisualConfig('classicHandScale', value)} />
                  <NumericControl label="Mão mágica" min={0.6} max={1.4} step={0.05} value={visualConfig.powerHandScale} onChange={(value) => updateVisualConfig('powerHandScale', value)} />
                  <NumericControl label="Órbita horizontal" min={20} max={44} step={1} value={visualConfig.seatOrbitX} onChange={(value) => updateVisualConfig('seatOrbitX', value)} />
                  <NumericControl label="Órbita vertical" min={16} max={36} step={1} value={visualConfig.seatOrbitY} onChange={(value) => updateVisualConfig('seatOrbitY', value)} />
                  <NumericControl label="Elevação do player" min={0} max={10} step={1} value={visualConfig.seatLift} onChange={(value) => updateVisualConfig('seatLift', value)} />
                </Section>
                <Section icon={Settings2} title="Animações">
                  <NumericControl label="Duração (ms)" min={100} max={2000} step={50} value={visualConfig.animationDuration} onChange={(value) => updateVisualConfig('animationDuration', value)} />
                  <NumericControl label="Intervalo (ms)" min={0} max={2000} step={50} value={visualConfig.animationDelay} onChange={(value) => updateVisualConfig('animationDelay', value)} />
                  <NumericControl label="Mão clássica Y (%)" min={-10} max={30} step={1} value={visualConfig.classicHandOffsetY} onChange={(value) => updateVisualConfig('classicHandOffsetY', value)} />
                  <NumericControl label="Mão mágica X (%)" min={-40} max={40} step={1} value={visualConfig.powerHandOffsetX} onChange={(value) => updateVisualConfig('powerHandOffsetX', value)} />
                  <NumericControl label="Mão mágica Y (%)" min={-20} max={20} step={1} value={visualConfig.powerHandOffsetY} onChange={(value) => updateVisualConfig('powerHandOffsetY', value)} />
                  <label className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm font-semibold text-zinc-200">
                    Guias de posicionamento
                    <input type="checkbox" checked={visualConfig.showGuides} onChange={(event) => updateVisualConfig('showGuides', event.target.checked)} />
                  </label>
                </Section>
              </div>
            ) : null}

            {controlTab === 'json' ? (
              <div className="grid gap-4 sm:col-span-2">
                <div className="flex items-center gap-2 text-sm font-black text-amber-100"><Code2 className="size-4 text-amber-300" /> Ações cadastradas em JSON</div>
                <pre className="max-h-80 overflow-auto rounded-xl border border-white/10 bg-black/60 p-4 text-xs leading-relaxed text-emerald-100">{JSON.stringify({ ...selectedPowerCard, selectedClassicCard }, null, 2)}</pre>
              </div>
            ) : null}
          </div>

          <div className="hidden">
            <Button type="button" disabled={!timeline.length || isRunning} onClick={() => void runTimeline()}><Play /> Executar {timeline.length} ações</Button>
            <Button type="button" variant="outline" disabled={!timeline.length || isRunning} onClick={() => setSnapshot((current) => ({ ...current, timeline: [] }))}><Trash2 /> Limpar timeline</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function TimelineList({ timeline, onRemove, onMove }) {
  if (!timeline.length) {
    return <p className="rounded-xl border border-dashed border-white/10 px-3 py-5 text-center text-xs font-semibold text-zinc-500">Nenhuma ação na fila.</p>;
  }

  return (
    <div className="grid max-h-[26rem] gap-2 overflow-y-auto pr-1">
      {timeline.map((action, index) => (
        <div key={action.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-bold text-zinc-100">{index + 1}. {actionLabels[action.type] || action.type}</span>
            <button type="button" className="text-zinc-500 hover:text-red-200" aria-label="Remover ação" onClick={() => onRemove(action.id)}><Trash2 className="size-3.5" /></button>
          </div>
          <div className="mt-2 flex gap-1">
            <button type="button" disabled={index === 0} className="rounded border border-white/10 px-1.5 text-[0.65rem] text-zinc-300 disabled:opacity-30" onClick={() => onMove(index, -1)}>↑</button>
            <button type="button" disabled={index === timeline.length - 1} className="rounded border border-white/10 px-1.5 text-[0.65rem] text-zinc-300 disabled:opacity-30" onClick={() => onMove(index, 1)}>↓</button>
          </div>
        </div>
      ))}
    </div>
  );
}
