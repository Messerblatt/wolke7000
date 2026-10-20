import type {
    Condition,
    //GameAction
} from "../runtime/types"

import type {
    GameState
} from "../runtime/game-state"


import {
  ConditionEvaluator,
} from "../runtime/condition-evaluator"

import {
  ActionExecutor,
} from "../runtime/action-executor"

type DialogueChoice = {
  id: string
  text: string
  next?: string
  conditions?: Condition[]
  actions?: GameAction[]
}

type DialogueNode = {
  id: string
  speaker: string
  text: string
  next?: string
  choices?: DialogueChoice[]
  actions?: GameAction[]
}

type DialogueDefinition = {
  id: string
  characterId: string
  startNode: string
  nodes: Record<string, DialogueNode>
}




class DialogueEngine {
  private dialogues = new Map<string, DialogueDefinition>()

  private activeDialogue?: DialogueDefinition
  private currentNodeId?: string

  constructor(
    private state: GameState,
    private actions: ActionExecutor,
    private conditions: ConditionEvaluator,
  ) {}

  register(dialogue: DialogueDefinition) {
    this.dialogues.set(dialogue.id, dialogue)
  }

  async start(dialogueId: string) {
    const dialogue = this.dialogues.get(dialogueId)

    if (!dialogue) {
      throw new Error(`Unknown dialogue: ${dialogueId}`)
    }

    this.activeDialogue = dialogue
    this.currentNodeId = dialogue.startNode

    await this.enterCurrentNode()
  }

  getCurrentNode(): DialogueNode | undefined {
    if (!this.activeDialogue || !this.currentNodeId) {
      return
    }

    return this.activeDialogue.nodes[this.currentNodeId]
  }

  async continue() {
    const node = this.getCurrentNode()

    if (!node?.next) {
      this.end()
      return
    }

    this.currentNodeId = node.next

    await this.enterCurrentNode()
  }

  async choose(choiceId: string) {
    const node = this.getCurrentNode()

    const choice = node?.choices?.find(
      choice => choice.id === choiceId
    )

    if (!choice) {
      throw new Error(`Unknown dialogue choice: ${choiceId}`)
    }

    if (
      choice.conditions &&
      !(await this.conditions.all(choice.conditions))
    ) {
      return
    }

    if (choice.actions) {
      await this.actions.execute(choice.actions)
    }

    if (choice.next) {
      this.currentNodeId = choice.next
      await this.enterCurrentNode()
    } else {
      this.end()
    }
  }

  private async enterCurrentNode() {
    const node = this.getCurrentNode()

    if (!node) {
      this.end()
      return
    }

    if (node.actions) {
      await this.actions.execute(node.actions)
    }

    window.dispatchEvent(
      new CustomEvent("wolke:dialogue-node", {
        detail: {
          dialogueId: this.activeDialogue?.id,
          node,
        },
      }),
    )
  }

  end() {
    if (this.activeDialogue) {
      this.state.dialogue.completed.add(
        this.activeDialogue.id
      )
    }

    this.activeDialogue = undefined
    this.currentNodeId = undefined

    window.dispatchEvent(
      new CustomEvent("wolke:dialogue-ended")
    )
  }
}



export type GameAction =
  | {
      type: "set-state"
      key: string
      value: string | number | boolean
    }
  | {
      type: "set-character-flag"
      characterId: string
      key: string
      value: boolean
    }
  | {
      type: "relationship-change"
      characterId: string
      amount: number
    }
  | {
      type: "give-item"
      itemId: string
    }
  | {
      type: "remove-item"
      itemId: string
    }