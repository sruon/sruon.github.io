import { BitReader } from './bitreader.js'

export function parseAction(bytes) {
  if (bytes.length < 5) {
    return null
  }

  if (bytes[0] !== 0x28) {
    return null
  }

  const reader = new BitReader(bytes)
  reader.setPosition(5)

  const action = {
    m_uID: reader.read(32),
    trg_sum: reader.read(6),
    res_sum: reader.read(4),
    cmd_no: reader.read(4),
    cmd_arg: reader.read(32),
    info: reader.read(32),
    target: []
  }

  for (let t = 0; t < action.trg_sum; t++) {
    const target = {
      m_uID: reader.read(32),
      result_sum: reader.read(4),
      result: []
    }

    for (let r = 0; r < target.result_sum; r++) {
      const result = {
        miss: reader.read(3),
        kind: reader.read(2),
        sub_kind: reader.read(12),
        info: reader.read(5),
        scale: reader.read(5),
        value: reader.read(17),
        message: reader.read(10),
        bit: reader.read(31),
        has_proc: false,
        proc_kind: 0,
        proc_info: 0,
        proc_value: 0,
        proc_message: 0,
        has_react: false,
        react_kind: 0,
        react_info: 0,
        react_value: 0,
        react_message: 0
      }

      if (reader.read(1) > 0) {
        result.has_proc = true
        result.proc_kind = reader.read(6)
        result.proc_info = reader.read(4)
        result.proc_value = reader.read(17)
        result.proc_message = reader.read(10)
      }

      if (reader.read(1) > 0) {
        result.has_react = true
        result.react_kind = reader.read(6)
        result.react_info = reader.read(4)
        result.react_value = reader.read(14)
        result.react_message = reader.read(10)
      }

      target.result.push(result)
    }

    action.target.push(target)
  }

  return action
}

export function getActionName(cmd_no) {
  const names = {
    0: 'None',
    1: 'Attack',
    2: 'Ranged Attack Finish',
    3: 'Weapon Skill Finish',
    4: 'Magic Finish',
    5: 'Item Finish',
    6: 'Job Ability Finish',
    7: 'Monster/Weapon Skill Start',
    8: 'Magic Start',
    9: 'Item Start',
    10: 'Job Ability Start',
    11: 'Monster Skill Finish',
    12: 'Ranged Attack Start',
    14: 'Dancer',
    15: 'Rune Fencer'
  }

  return names[cmd_no] ?? `${cmd_no}:Unknown`
}

export function getMissName(id) {
  const names = {
    0: 'hit',
    1: 'miss',
    2: 'guard',
    3: 'parry',
    4: 'block',
    9: 'evade'
  }

  return names[id] ?? `${id}:unknown`
}
