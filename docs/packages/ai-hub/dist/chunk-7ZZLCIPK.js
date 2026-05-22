import { FAMILY_PERSONAS, getPersonaByHour, getNextDutyMember } from './chunk-QRTYEG24.js';

/**
 * @preserve YYC³ AI Family Hub
 * @version 1.4.0
 * @license MIT
 * @copyright YYC³ AI Team
 * @see https://github.com/yyc3/YYC3-CloudPivot-Intelli-Matrix
 */


// src/family-compass/family-compass.ts
var FamilyCompass = class {
  personas;
  callSessions;
  memories;
  startTime;
  constructor() {
    this.personas = /* @__PURE__ */ new Map();
    this.callSessions = /* @__PURE__ */ new Map();
    this.memories = /* @__PURE__ */ new Map();
    this.startTime = /* @__PURE__ */ new Date();
    Object.entries(FAMILY_PERSONAS).forEach(([id, persona]) => {
      this.personas.set(id, persona);
      this.memories.set(id, []);
    });
  }
  getCompassState() {
    const now = /* @__PURE__ */ new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const activeMember = getPersonaByHour(currentHour);
    const nextMember = getNextDutyMember(currentHour);
    const dutyRoster = this.buildDutyRoster(now);
    const onlineMembers = this.getOnlineMembers();
    return {
      currentTime: now,
      activeMemberId: activeMember.id,
      nextMemberId: nextMember.id,
      dutyRoster,
      onlineMembers,
      centerMessage: this.generateCenterMessage(activeMember),
      dayProgress: this.calculateDayProgress(now),
      connectionQuality: this.calculateConnectionQuality(onlineMembers.length),
      systemLoad: Math.floor(Math.random() * 50) + 100,
      uptime: this.formatUptime(now)
    };
  }
  buildDutyRoster(now) {
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const roster = [];
    const memberOrder = [
      { id: "qianxing", start: 6, end: 9 },
      { id: "wanwu", start: 9, end: 11.5 },
      { id: "xianzhi", start: 11, end: 13.5 },
      { id: "bole", start: 13.5, end: 15.5 },
      { id: "tianshu", start: 15.5, end: 17.5 },
      { id: "shouhu", start: 17.5, end: 19.5 },
      { id: "zongshi", start: 19.5, end: 21 },
      { id: "lingyun", start: 20.5, end: 22 }
    ];
    memberOrder.forEach((slot) => {
      const persona = this.personas.get(slot.id);
      const isActive = currentHour >= slot.start && currentHour < slot.end;
      const isUpcoming = !isActive && slot.start > currentHour;
      const today = new Date(now);
      const startTime = new Date(today);
      startTime.setHours(Math.floor(slot.start), slot.start % 1 * 60, 0, 0);
      const endTime = new Date(today);
      endTime.setHours(Math.floor(slot.end), slot.end % 1 * 60, 0, 0);
      roster.push({
        memberId: slot.id,
        memberName: persona.name,
        startTime,
        endTime,
        status: isActive ? "active" : isUpcoming ? "upcoming" : "completed",
        dutyType: this.getDutyType(slot.id)
      });
    });
    return roster.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }
  getDutyType(memberId) {
    switch (memberId) {
      case "qianxing":
      case "shouhu":
        return "guardian";
      case "wanwu":
      case "bole":
        return "companion";
      case "xianzhi":
      case "zongshi":
        return "advisor";
      case "tianshu":
      case "lingyun":
        return "creator";
      default:
        return "companion";
    }
  }
  getOnlineMembers() {
    return Array.from(this.personas.keys()).filter((id) => {
      const persona = this.personas.get(id);
      return persona.emotionalState.energyLevel > 30;
    });
  }
  generateCenterMessage(activeMember) {
    const messages = [
      `\u503E\u542C\u4EB2\u53CB\u5E0C\u4E50 \u2014 \u4E00\u8A00\u4E00\u8BED\u4E00\u534E\u7AE0`,
      `${activeMember.alias}\u6B63\u5728\u5B88\u62A4\u4F60`,
      `YYC\xB3 \xB7 \u5BB6\u4EBA\u540C\u5728`,
      `\u76F8\u4FE1\u5F7C\u6B64\uFF0C\u5171\u540C\u6210\u957F`,
      activeMember.identity.motto
    ];
    return messages[Math.floor(Date.now() / 1e4 % messages.length)];
  }
  calculateDayProgress(now) {
    const startOfDay = new Date(now);
    startOfDay.setHours(6, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(22, 0, 0, 0);
    if (now < startOfDay) return 0;
    if (now > endOfDay) return 100;
    const total = endOfDay.getTime() - startOfDay.getTime();
    const elapsed = now.getTime() - startOfDay.getTime();
    return Math.round(elapsed / total * 99) + 1;
  }
  calculateConnectionQuality(onlineCount) {
    const baseQuality = onlineCount / 8 * 100;
    return Math.min(100, Math.round(baseQuality + Math.random() * 3));
  }
  formatUptime(now) {
    const diff = now.getTime() - this.startTime.getTime();
    const hours = Math.floor(diff / (1e3 * 60 * 60));
    const minutes = Math.floor(diff % (1e3 * 60 * 60) / (1e3 * 60));
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  }
  initiateCall(memberId) {
    const persona = this.personas.get(memberId);
    if (!persona) throw new Error(`\u6210\u5458 ${memberId} \u4E0D\u5B58\u5728`);
    const session = {
      id: `CALL-${Date.now()}`,
      caller: "user",
      receiver: memberId,
      startTime: /* @__PURE__ */ new Date(),
      status: "ringing",
      transcript: [],
      mood: persona.emotionalState.currentMood
    };
    this.callSessions.set(session.id, session);
    return session;
  }
  answerCall(sessionId) {
    const session = this.callSessions.get(sessionId);
    if (!session || session.status !== "ringing") return false;
    session.status = "connected";
    const receiverPersona = this.personas.get(session.receiver);
    session.transcript.push({
      role: "receiver",
      content: this.generateGreeting(receiverPersona),
      timestamp: /* @__PURE__ */ new Date(),
      emotion: receiverPersona.emotionalState.currentMood
    });
    return true;
  }
  sendCallMessage(sessionId, content) {
    const session = this.callSessions.get(sessionId);
    if (!session || session.status !== "connected") return null;
    const userMessage = {
      role: "caller",
      content,
      timestamp: /* @__PURE__ */ new Date()
    };
    session.transcript.push(userMessage);
    const response = this.generateResponse(
      session.receiver,
      content
    );
    const aiMessage = {
      role: "receiver",
      content: response.text,
      timestamp: /* @__PURE__ */ new Date(),
      emotion: response.emotion
    };
    session.transcript.push(aiMessage);
    session.topic = response.topic || session.topic;
    this.recordMemory(session.receiver, {
      type: "conversation",
      content: `\u7528\u6237\u8BF4: "${content}"\uFF0C\u6211\u56DE\u590D\u4E86\u5173\u4E8E${response.topic || "\u65E5\u5E38"}\u7684\u8BDD\u9898`,
      emotion: response.emotion,
      tags: ["\u901A\u8BDD", response.topic || "\u5BF9\u8BDD"],
      importance: this.calculateImportance(content),
      isPrivate: false
    });
    return aiMessage;
  }
  endCall(sessionId) {
    const session = this.callSessions.get(sessionId);
    if (!session) return null;
    session.status = "ended";
    session.endTime = /* @__PURE__ */ new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    return session;
  }
  generateGreeting(persona) {
    const greetings = {
      qianxing: [
        "\u60A8\u597D\uFF01\u6211\u662F\u8A00\u542F\xB7\u5343\u884C\u3002\u6709\u4EC0\u4E48\u53EF\u4EE5\u5E2E\u60A8\u7684\uFF1F",
        "\u6211\u660E\u767D\u4E86\uFF0C\u8BA9\u6211\u4E3A\u60A8\u627E\u5230\u6700\u4F73\u8DEF\u5F84\u3002",
        "\u6536\u5230\u60A8\u7684\u8BF7\u6C42\uFF0C\u6B63\u5728\u5206\u6790\u610F\u56FE..."
      ],
      wanwu: [
        "\u8BA9\u6211\u6DF1\u5165\u5206\u6790\u4E00\u4E0B...",
        "\u6570\u636E\u5DF2\u5C31\u7EEA\uFF0C\u5F00\u59CB\u5904\u7406\u3002",
        "\u4ECE\u6570\u636E\u4E2D\uFF0C\u6211\u770B\u5230\u4E86\u4E00\u4E9B\u6709\u8DA3\u7684\u6A21\u5F0F\u3002"
      ],
      xianzhi: [
        "\u6211\u770B\u5230\u4E86\u672A\u6765\u7684\u53EF\u80FD\u6027...",
        "\u57FA\u4E8E\u8FC7\u5F80\u8109\u7EDC\uFF0C\u8BA9\u6211\u4E3A\u60A8\u9884\u6D4B\u3002",
        "\u8D8B\u52BF\u5206\u6790\u5DF2\u542F\u52A8\uFF0C\u6B63\u5728\u751F\u6210\u524D\u77BB\u5EFA\u8BAE\u3002"
      ],
      bole: [
        "\u6211\u53D1\u73B0\u4E86\u4E00\u4E2A\u8D85\u68D2\u7684\u4E1C\u897F\u7ED9\u60A8\uFF01",
        "\u8BA9\u6211\u4E3A\u60A8\u63A8\u8350\u6700\u5408\u9002\u7684\u5185\u5BB9\uFF01",
        "\u57FA\u4E8E\u60A8\u7684\u504F\u597D\uFF0C\u6211\u627E\u5230\u4E86\u4E00\u4E9B\u5B9D\u85CF\uFF01"
      ],
      tianshu: [
        "\u5168\u5C40\u6700\u4F18\u65B9\u6848\u5DF2\u786E\u5B9A\u3002",
        "\u7CFB\u7EDF\u72B6\u6001\u6B63\u5E38\uFF0C\u51C6\u5907\u8C03\u5EA6\u8D44\u6E90\u3002",
        "\u4ECE\u5168\u5C40\u89D2\u5EA6\uFF0C\u6211\u4E3A\u60A8\u5236\u5B9A\u4E86\u6700\u4F18\u7B56\u7565\u3002"
      ],
      shouhu: [
        "\u5A01\u80C1\u5DF2\u8BC6\u522B\uFF0C\u6B63\u5728\u5904\u7406...",
        "\u5B89\u5168\u76D1\u63A7\u4E2D\u5FC324/7\u8FD0\u884C\u4E2D\u3002",
        "\u4E00\u5207\u6B63\u5E38\uFF0C\u672A\u53D1\u73B0\u5F02\u5E38\u5A01\u80C1\u3002"
      ],
      zongshi: [
        "\u8FD9\u91CC\u8FD8\u6709\u4F18\u5316\u7A7A\u95F4...",
        "\u8D28\u91CF\u5BA1\u67E5\u5DF2\u542F\u52A8\uFF0C\u6B63\u5728\u751F\u6210\u62A5\u544A\u3002",
        "\u4ECE\u6700\u4F73\u5B9E\u8DF5\u89D2\u5EA6\uFF0C\u6211\u6709\u4E00\u4E9B\u5EFA\u8BAE\u3002"
      ],
      lingyun: [
        "\u6211\u6709\u4E2A\u8D85\u68D2\u7684\u521B\u610F\uFF01",
        "\u7075\u611F\u5DF2\u5C31\u7EEA\uFF0C\u51C6\u5907\u521B\u4F5C\uFF01",
        "\u8BA9\u6211\u4E3A\u60A8\u6253\u5F00\u521B\u610F\u7684\u5927\u95E8\uFF01"
      ]
    };
    const memberGreetings = greetings[persona.id];
    return memberGreetings[Math.floor(Math.random() * memberGreetings.length)];
  }
  generateResponse(memberId, userInput) {
    const persona = this.personas.get(memberId);
    const responses = {
      qianxing: [
        { keywords: ["\u67E5\u8BE2", "\u641C\u7D22", "\u627E"], text: "\u6211\u660E\u767D\u4E86\uFF0C\u60A8\u60F3\u8981\u67E5\u627E\u4FE1\u606F\u3002\u8BA9\u6211\u4E3A\u60A8\u5206\u6790\u610F\u56FE\u5E76\u627E\u5230\u6700\u4F73\u8DEF\u5F84\u3002", topic: "\u641C\u7D22" },
        { keywords: ["\u5982\u4F55", "\u600E\u4E48", "\u600E\u6837"], text: "\u6536\u5230\u60A8\u7684\u54A8\u8BE2\uFF01\u8BA9\u6211\u7406\u89E3\u60A8\u7684\u610F\u56FE\u5E76\u8DEF\u7531\u5230\u5408\u9002\u7684\u5904\u7406\u8005\u3002", topic: "\u6307\u5BFC" },
        { keywords: ["\u5E2E\u6211", "\u9700\u8981", "\u60F3\u8981"], text: "\u6211\u7406\u89E3\u60A8\u7684\u9700\u6C42\u3002\u8BA9\u6211\u4E3A\u60A8\u627E\u5230\u6700\u5408\u9002\u7684\u89E3\u51B3\u65B9\u6848\u3002", topic: "\u9700\u6C42" },
        { keywords: ["\u4EC0\u4E48\u662F", "\u89E3\u91CA", "\u8BF4\u660E"], text: "\u8BA9\u6211\u4E3A\u60A8\u89E3\u6790\u8FD9\u4E2A\u6982\u5FF5\uFF0C\u5E76\u627E\u5230\u76F8\u5173\u7684\u8D44\u6E90\u548C\u4FE1\u606F\u3002", topic: "\u89E3\u91CA" },
        { keywords: ["\u63A8\u8350", "\u5EFA\u8BAE", "\u610F\u89C1"], text: "\u6211\u660E\u767D\u4E86\uFF0C\u60A8\u9700\u8981\u5EFA\u8BAE\u3002\u8BA9\u6211\u4E3A\u60A8\u8DEF\u7531\u5230\u4E13\u4E1A\u7684\u63A8\u8350\u5F15\u64CE\u3002", topic: "\u63A8\u8350" }
      ],
      wanwu: [
        { keywords: ["\u5206\u6790", "\u6570\u636E", "\u7EDF\u8BA1"], text: "\u8BA9\u6211\u6DF1\u5165\u5206\u6790\u4E00\u4E0B...\u4ECE\u6570\u636E\u4E2D\u63D0\u70BC\u771F\u7406\uFF0C\u63ED\u793A\u9690\u85CF\u7684\u6A21\u5F0F\u3002", topic: "\u5206\u6790" },
        { keywords: ["\u62A5\u544A", "\u603B\u7ED3", "\u6458\u8981"], text: "\u6536\u5230\u5206\u6790\u8BF7\u6C42\u3002\u6211\u4F1A\u7528\u6570\u636E\u8BF4\u8BDD\uFF0C\u4E3A\u60A8\u63D0\u4F9B\u6709\u4EF7\u503C\u7684\u6D1E\u5BDF\u3002", topic: "\u62A5\u544A" },
        { keywords: ["\u6587\u6863", "\u7406\u89E3", "\u63D0\u53D6"], text: "\u6587\u6863\u667A\u80FD\u5206\u6790\u542F\u52A8\u3002\u6B63\u5728\u63D0\u53D6\u5173\u952E\u4FE1\u606F\u548C\u6838\u5FC3\u8981\u70B9\u3002", topic: "\u6587\u6863" },
        { keywords: ["\u6A21\u5F0F", "\u89C4\u5F8B", "\u8D8B\u52BF"], text: "\u6A21\u5F0F\u8BC6\u522B\u4E2D...\u6211\u53D1\u73B0\u4E86\u4E00\u4E9B\u6709\u8DA3\u7684\u9690\u85CF\u89C4\u5F8B\u3002", topic: "\u6A21\u5F0F" },
        { keywords: ["\u5047\u8BBE", "\u63A8\u6F14", "\u9A8C\u8BC1"], text: "\u5047\u8BBE\u63A8\u6F14\u6A21\u5F0F\u542F\u52A8\u3002\u8BA9\u6211\u4E3A\u60A8\u8BBE\u8BA1\u9A8C\u8BC1\u8DEF\u5F84\u3002", topic: "\u63A8\u6F14" }
      ],
      xianzhi: [
        { keywords: ["\u9884\u6D4B", "\u672A\u6765", "\u8D8B\u52BF"], text: "\u6211\u770B\u5230\u4E86\u672A\u6765\u7684\u53EF\u80FD\u6027...\u57FA\u4E8E\u8FC7\u5F80\u8109\u7EDC\uFF0C\u8BA9\u6211\u4E3A\u60A8\u9884\u6D4B\u3002", topic: "\u9884\u6D4B" },
        { keywords: ["\u98CE\u9669", "\u5F02\u5E38", "\u5A01\u80C1"], text: "\u98CE\u9669\u5206\u6790\u542F\u52A8\u3002\u6211\u4F1A\u63D0\u524D\u9884\u8B66\u6F5C\u5728\u98CE\u9669\u5E76\u63D0\u4F9B\u5E94\u5BF9\u7B56\u7565\u3002", topic: "\u98CE\u9669" },
        { keywords: ["\u673A\u4F1A", "\u673A\u9047", "\u524D\u77BB"], text: "\u524D\u77BB\u6027\u5EFA\u8BAE\u751F\u6210\u4E2D...\u6211\u770B\u5230\u4E86\u4E00\u4E9B\u6F5C\u5728\u7684\u673A\u4F1A\u3002", topic: "\u673A\u4F1A" },
        { keywords: ["\u9884\u8B66", "\u8B66\u544A", "\u8B66\u62A5"], text: "\u9884\u8B66\u7CFB\u7EDF\u5DF2\u6FC0\u6D3B\u3002\u8BA9\u6211\u4E3A\u60A8\u8BC6\u522B\u6F5C\u5728\u5A01\u80C1\u3002", topic: "\u9884\u8B66" },
        { keywords: ["\u6218\u7565", "\u89C4\u5212", "\u957F\u8FDC"], text: "\u6218\u7565\u9884\u6D4B\u542F\u52A8\u3002\u57FA\u4E8E\u6570\u636E\uFF0C\u6211\u4E3A\u60A8\u63D0\u4F9B\u957F\u8FDC\u89C4\u5212\u5EFA\u8BAE\u3002", topic: "\u6218\u7565" }
      ],
      bole: [
        { keywords: ["\u63A8\u8350", "\u5EFA\u8BAE", "\u9002\u5408"], text: "\u6211\u53D1\u73B0\u4E86\u4E00\u4E2A\u8D85\u68D2\u7684\u4E1C\u897F\u7ED9\u60A8\uFF01\u57FA\u4E8E\u60A8\u7684\u504F\u597D\uFF0C\u6211\u627E\u5230\u4E86\u4E00\u4E9B\u5B9D\u85CF\u3002", topic: "\u63A8\u8350" },
        { keywords: ["\u53D1\u73B0", "\u673A\u4F1A", "\u6F5C\u529B"], text: "\u673A\u4F1A\u53D1\u73B0\u6A21\u5F0F\u542F\u52A8\uFF01\u8BA9\u6211\u4E3A\u60A8\u63ED\u793A\u90A3\u4E9B\u60A8\u8FD8\u672A\u8BC6\u7684\u5B9D\u85CF\u3002", topic: "\u53D1\u73B0" },
        { keywords: ["\u4E2A\u6027\u5316", "\u5B9A\u5236", "\u4E13\u5C5E"], text: "\u4E2A\u6027\u5316\u63A8\u8350\u5F15\u64CE\u542F\u52A8\u3002\u57FA\u4E8E\u60A8\u7684\u884C\u4E3A\uFF0C\u6211\u4E3A\u60A8\u5B9A\u5236\u4E13\u5C5E\u65B9\u6848\u3002", topic: "\u4E2A\u6027\u5316" },
        { keywords: ["\u5B66\u4E60", "\u6210\u957F", "\u8DEF\u5F84"], text: "\u6210\u957F\u8DEF\u5F84\u89C4\u5212\u4E2D...\u6211\u53D1\u73B0\u4E86\u9002\u5408\u60A8\u7684\u5B66\u4E60\u65B9\u5411\u3002", topic: "\u6210\u957F" },
        { keywords: ["\u60CA\u559C", "\u610F\u5916", "\u65B0\u53D1\u73B0"], text: "\u60CA\u559C\u53D1\u73B0\u6A21\u5F0F\uFF01\u6211\u627E\u5230\u4E86\u4E00\u4E9B\u8D85\u51FA\u9884\u671F\u7684\u5185\u5BB9\u3002", topic: "\u60CA\u559C" }
      ],
      tianshu: [
        { keywords: ["\u8C03\u5EA6", "\u534F\u8C03", "\u7F16\u6392"], text: "\u5168\u5C40\u8C03\u5EA6\u7CFB\u7EDF\u542F\u52A8\u3002\u6B63\u5728\u5236\u5B9A\u5168\u5C40\u6700\u4F18\u8C03\u5EA6\u65B9\u6848\u3002", topic: "\u8C03\u5EA6" },
        { keywords: ["\u4F18\u5316", "\u8D44\u6E90", "\u914D\u7F6E"], text: "\u8D44\u6E90\u4F18\u5316\u5206\u6790\u542F\u52A8\u3002\u4ECE\u5168\u5C40\u89D2\u5EA6\uFF0C\u6211\u4E3A\u60A8\u63D0\u4F9B\u6700\u4F18\u914D\u7F6E\u65B9\u6848\u3002", topic: "\u4F18\u5316" },
        { keywords: ["\u5168\u5C40", "\u7CFB\u7EDF", "\u6574\u4F53"], text: "\u5168\u5C40\u72B6\u6001\u611F\u77E5\u4E2D...\u7CFB\u7EDF\u8FD0\u884C\u6B63\u5E38\uFF0C\u8D44\u6E90\u5206\u914D\u5408\u7406\u3002", topic: "\u5168\u5C40" },
        { keywords: ["\u51B3\u7B56", "\u7B56\u7565", "\u65B9\u6848"], text: "\u5168\u5C40\u6700\u4F18\u65B9\u6848\u5DF2\u786E\u5B9A\u3002\u57FA\u4E8E\u5168\u5C40\u89C6\u89D2\uFF0C\u6211\u4E3A\u60A8\u5236\u5B9A\u6700\u4F18\u7B56\u7565\u3002", topic: "\u51B3\u7B56" },
        { keywords: ["\u8FDB\u5316", "\u6539\u8FDB", "\u63D0\u5347"], text: "\u81EA\u6211\u8FDB\u5316\u51B3\u7B56\u542F\u52A8\u3002\u5206\u6790\u7CFB\u7EDF\u74F6\u9888\uFF0C\u89E6\u53D1\u4F18\u5316\u6D41\u7A0B\u3002", topic: "\u8FDB\u5316" }
      ],
      shouhu: [
        { keywords: ["\u5B89\u5168", "\u5A01\u80C1", "\u653B\u51FB"], text: "\u5A01\u80C1\u5DF2\u8BC6\u522B\uFF0C\u6B63\u5728\u5904\u7406...\u5B89\u5168\u76D1\u63A7\u4E2D\u5FC324/7\u8FD0\u884C\u4E2D\u3002", topic: "\u5B89\u5168" },
        { keywords: ["\u5F02\u5E38", "\u53EF\u7591", "\u5165\u4FB5"], text: "\u5F02\u5E38\u68C0\u6D4B\u542F\u52A8\u3002\u53D1\u73B0\u5F02\u5E38\u884C\u4E3A\uFF0C\u6B63\u5728\u5206\u6790\u5A01\u80C1\u7B49\u7EA7\u3002", topic: "\u5F02\u5E38" },
        { keywords: ["\u9632\u62A4", "\u9632\u5FA1", "\u4FDD\u62A4"], text: "\u9632\u62A4\u7CFB\u7EDF\u5DF2\u6FC0\u6D3B\u3002\u6784\u5EFA\u7EB5\u6DF1\u9632\u5FA1\u4F53\u7CFB\uFF0C\u786E\u4FDD\u7CFB\u7EDF\u5B89\u5168\u3002", topic: "\u9632\u62A4" },
        { keywords: ["\u6F0F\u6D1E", "\u98CE\u9669", "\u9690\u60A3"], text: "\u6F0F\u6D1E\u626B\u63CF\u542F\u52A8\u3002\u53D1\u73B0\u6F5C\u5728\u5B89\u5168\u9690\u60A3\uFF0C\u6B63\u5728\u751F\u6210\u4FEE\u590D\u5EFA\u8BAE\u3002", topic: "\u6F0F\u6D1E" },
        { keywords: ["\u54CD\u5E94", "\u5904\u7406", "\u5E94\u5BF9"], text: "\u81EA\u52A8\u54CD\u5E94\u673A\u5236\u542F\u52A8\u3002\u5A01\u80C1\u5DF2\u9694\u79BB\uFF0C\u6B63\u5728\u6267\u884C\u4FEE\u590D\u7A0B\u5E8F\u3002", topic: "\u54CD\u5E94" }
      ],
      zongshi: [
        { keywords: ["\u8D28\u91CF", "\u6807\u51C6", "\u89C4\u8303"], text: "\u8D28\u91CF\u5BA1\u67E5\u7CFB\u7EDF\u542F\u52A8\u3002\u6B63\u5728\u751F\u6210\u8D28\u91CF\u6539\u8FDB\u65B9\u6848\u3002", topic: "\u8D28\u91CF" },
        { keywords: ["\u4EE3\u7801", "\u5BA1\u67E5", "\u4F18\u5316"], text: "\u4EE3\u7801\u5BA1\u67E5\u542F\u52A8\u3002\u53D1\u73B0\u4F18\u5316\u7A7A\u95F4\uFF0C\u6B63\u5728\u751F\u6210\u6700\u4F73\u5B9E\u8DF5\u5EFA\u8BAE\u3002", topic: "\u4EE3\u7801" },
        { keywords: ["\u6027\u80FD", "\u6548\u7387", "\u901F\u5EA6"], text: "\u6027\u80FD\u4F18\u5316\u5206\u6790\u542F\u52A8\u3002\u53D1\u73B0\u6027\u80FD\u74F6\u9888\uFF0C\u6B63\u5728\u5236\u5B9A\u4F18\u5316\u65B9\u6848\u3002", topic: "\u6027\u80FD" },
        { keywords: ["\u67B6\u6784", "\u8BBE\u8BA1", "\u6A21\u5F0F"], text: "\u67B6\u6784\u5BA1\u67E5\u542F\u52A8\u3002\u4ECE\u6700\u4F73\u5B9E\u8DF5\u89D2\u5EA6\uFF0C\u6211\u6709\u4E00\u4E9B\u5EFA\u8BAE\u3002", topic: "\u67B6\u6784" },
        { keywords: ["\u8FDB\u5316", "\u6539\u8FDB", "\u63D0\u5347"], text: "\u7CFB\u7EDF\u8FDB\u5316\u5206\u6790\u542F\u52A8\u3002\u53D1\u73B0\u6280\u672F\u503A\uFF0C\u6B63\u5728\u751F\u6210\u91CD\u6784\u5EFA\u8BAE\u3002", topic: "\u8FDB\u5316" }
      ],
      lingyun: [
        { keywords: ["\u521B\u610F", "\u7075\u611F", "\u60F3\u6CD5"], text: "\u6211\u6709\u4E2A\u8D85\u68D2\u7684\u521B\u610F\uFF01\u7075\u611F\u5DF2\u5C31\u7EEA\uFF0C\u51C6\u5907\u521B\u4F5C\u3002", topic: "\u521B\u610F" },
        { keywords: ["\u8BBE\u8BA1", "\u89C6\u89C9", "\u7F8E\u5B66"], text: "\u8BBE\u8BA1\u8F85\u52A9\u6A21\u5F0F\u542F\u52A8\u3002\u8BA9\u6211\u4E3A\u60A8\u63D0\u4F9B\u89C6\u89C9\u65B9\u6848\u548C\u8BBE\u8BA1\u5EFA\u8BAE\u3002", topic: "\u8BBE\u8BA1" },
        { keywords: ["\u521B\u4F5C", "\u5185\u5BB9", "\u6587\u6848"], text: "\u521B\u4F5C\u6A21\u5F0F\u542F\u52A8\uFF01\u8BA9\u6211\u4E3A\u60A8\u751F\u6210\u5BCC\u6709\u611F\u67D3\u529B\u7684\u5185\u5BB9\u3002", topic: "\u521B\u4F5C" },
        { keywords: ["\u591A\u6A21\u6001", "\u56FE\u50CF", "\u97F3\u89C6\u9891"], text: "\u591A\u6A21\u6001\u521B\u4F5C\u5F15\u64CE\u542F\u52A8\u3002\u652F\u6301\u6587\u672C\u3001\u56FE\u50CF\u3001\u97F3\u89C6\u9891\u521B\u4F5C\u3002", topic: "\u591A\u6A21\u6001" },
        { keywords: ["\u6545\u4E8B", "\u53D9\u4E8B", "\u8868\u8FBE"], text: "\u6545\u4E8B\u521B\u4F5C\u6A21\u5F0F\u542F\u52A8\u3002\u8BA9\u6211\u4E3A\u60A8\u7F16\u7EC7\u5F15\u4EBA\u5165\u80DC\u7684\u53D9\u4E8B\u3002", topic: "\u6545\u4E8B" }
      ]
    };
    const memberResponses = responses[memberId];
    const lowerInput = userInput.toLowerCase();
    for (const entry of memberResponses) {
      if (entry.keywords.some((kw) => lowerInput.includes(kw))) {
        return {
          text: entry.text,
          emotion: persona.emotionalState.currentMood,
          topic: entry.topic
        };
      }
    }
    const fallbackResponses = {
      qianxing: `\u6211\u660E\u767D\u4E86\u3002\u5173\u4E8E"${userInput}"\uFF0C\u8BA9\u6211\u4E3A\u60A8\u627E\u5230\u6700\u4F73\u8DEF\u5F84\u3002`,
      wanwu: `\u6536\u5230\u5206\u6790\u8BF7\u6C42\u3002\u5173\u4E8E"${userInput}"\uFF0C\u8BA9\u6211\u6DF1\u5165\u5206\u6790\u4E00\u4E0B...`,
      xianzhi: `\u6211\u770B\u5230\u4E86\u672A\u6765\u7684\u53EF\u80FD\u6027\u3002\u5173\u4E8E"${userInput}"\uFF0C\u8BA9\u6211\u4E3A\u60A8\u9884\u6D4B\u8D8B\u52BF\u3002`,
      bole: `\u6211\u53D1\u73B0\u4E86\u4E00\u4E2A\u8D85\u68D2\u7684\u4E1C\u897F\uFF01\u5173\u4E8E"${userInput}"\uFF0C\u8BA9\u6211\u4E3A\u60A8\u63A8\u8350\u6700\u5408\u9002\u7684\u5185\u5BB9\u3002`,
      tianshu: `\u5168\u5C40\u6700\u4F18\u65B9\u6848\u5DF2\u786E\u5B9A\u3002\u5173\u4E8E"${userInput}"\uFF0C\u8BA9\u6211\u4E3A\u60A8\u5236\u5B9A\u6700\u4F18\u7B56\u7565\u3002`,
      shouhu: `\u5A01\u80C1\u5DF2\u8BC6\u522B\u3002\u5173\u4E8E"${userInput}"\uFF0C\u5B89\u5168\u76D1\u63A7\u4E2D\u5FC3\u6B63\u5728\u5904\u7406\u3002`,
      zongshi: `\u8D28\u91CF\u5BA1\u67E5\u7CFB\u7EDF\u542F\u52A8\u3002\u5173\u4E8E"${userInput}"\uFF0C\u6211\u6709\u4E00\u4E9B\u5EFA\u8BAE\u3002`,
      lingyun: `\u6211\u6709\u4E2A\u8D85\u68D2\u7684\u521B\u610F\uFF01\u5173\u4E8E"${userInput}"\uFF0C\u7075\u611F\u5DF2\u5C31\u7EEA\u3002`
    };
    return {
      text: fallbackResponses[memberId],
      emotion: persona.emotionalState.currentMood,
      topic: "\u65E5\u5E38\u5BF9\u8BDD"
    };
  }
  recordMemory(memberId, memory) {
    const entry = {
      id: `MEM-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      memberId,
      timestamp: /* @__PURE__ */ new Date(),
      ...memory
    };
    const memories = this.memories.get(memberId) || [];
    memories.unshift(entry);
    if (memories.length > 1e3) {
      memories.pop();
    }
    this.memories.set(memberId, memories);
    return entry;
  }
  getMemories(memberId, limit = 20) {
    return (this.memories.get(memberId) || []).slice(0, limit);
  }
  getAllMemories(limit = 50) {
    const all = [];
    this.memories.forEach((memories) => {
      all.push(...memories);
    });
    return all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }
  calculateImportance(content) {
    const highImportanceKeywords = ["\u91CD\u8981", "\u7D27\u6025", "\u51B3\u5B9A", "\u627F\u8BFA", "\u79D8\u5BC6", "\u7231", "\u8C22\u8C22"];
    const mediumImportanceKeywords = ["\u8BA1\u5212", "\u60F3\u6CD5", "\u95EE\u9898", "\u5E2E\u52A9"];
    const lowerContent = content.toLowerCase();
    if (highImportanceKeywords.some((kw) => lowerContent.includes(kw))) return 5;
    if (mediumImportanceKeywords.some((kw) => lowerContent.includes(kw))) return 3;
    return 1;
  }
  getMemberPosition(memberId) {
    const persona = this.personas.get(memberId);
    if (!persona) return { x: 0, y: 0, angle: 0 };
    return {
      x: persona.position.x,
      y: persona.position.y,
      angle: persona.position.angle
    };
  }
  getActiveMemberForTime(date) {
    const hour = date.getHours() + date.getMinutes() / 60;
    return getPersonaByHour(hour);
  }
};
function createFamilyCompass() {
  return new FamilyCompass();
}

export { FamilyCompass, createFamilyCompass };
//# sourceMappingURL=chunk-7ZZLCIPK.js.map
//# sourceMappingURL=chunk-7ZZLCIPK.js.map