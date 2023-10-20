import { useForm } from "react-hook-form";

import * as zod from "zod";

import { HandPalm, Play } from "phosphor-react";
import {
  CountdownContainer,
  FormContainer,
  HomeContainer,
  MinutesAmountInput,
  Separator,
  StartCountdownButton,
  StopCountdownButton,
  TaskInput,
} from "./styles";
import { useEffect, useState } from "react";
import { differenceInSeconds } from "date-fns";

const newCycleFormValidationSchema = zod.object({
  task: zod.string().min(1, "Informe a tarefa"),
  minutesAmount: zod.number().min(5).max(60),
});

type NewCycleFormData = zod.infer<typeof newCycleFormValidationSchema>;

interface Cycle {
  id: string;
  task: string;
  minutesAmount: number;
  startDate: Date;
  interruptedDate?: Date;
  finishDate?: Date;
}

export function Home() {
  const [cycles, setCycles] = useState<Cycle[]>([]);

  // Manter um estado para identificar um ciclo ativo (só pode ter um ciclo ativo por vez) vamos
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);

  // Vai armazenar o tanto de segundos que já se passaram desde que o ciclo foi criado
  // Lógica: Total de segundos que usuário criou - os segundos que já passaram desde que a task foi criada.
  const [amountSecondsPassed, setAmountSecondsPassed] = useState(0);

  const { register, handleSubmit, watch, reset } = useForm<NewCycleFormData>({
    defaultValues: {
      task: "",
      minutesAmount: 0,
    },
  });

  // Identificar o ciclo ativo para ser exibido na tela
  const activeCycle = cycles.find((cycle) => cycle.id === activeCycleId);

  // Manozear o countdown em segundos

  // Variável que vai converter o número de minutos (do ciclo) em segundos
  const totalSeconds = activeCycle ? activeCycle.minutesAmount * 60 : 0;

  // Conta de subtração
  const currentSeconds = activeCycle ? totalSeconds - amountSecondsPassed : 0;

  // Converter a variável de uma maneira que seja possível ser exibida na tela (Ex. 20 : 00 minutos e segundos)
  // Calcular a partir do total de segundos (Conta de subtração já feita), quantos minutos eu tenho dentro do total de segundos
  const minutesAmount = Math.floor(currentSeconds / 60);

  // Calcular quantos segundos eu tenho do resto dessa divisão
  // Todos segundos / (dividido) por 60, quantos segundos sobram que não cabem mais na divisão?
  const secondsAmount = currentSeconds % 60;

  // Converter numero de minutos para uma string para utilizar o método padStart
  // padStart: Preenche uma string até um tamanho específico com 1 caractere
  const minutes = String(minutesAmount).padStart(2, "0");
  const seconds = String(secondsAmount).padStart(2, "0");

  // Criar intervalo de tempo

  // SetInterval: não é preciso

  useEffect(() => {
    let interval: number;

    if (activeCycle) {
      interval = setInterval(() => {
        const secondsDifferance = differenceInSeconds(
          new Date(),
          activeCycle.startDate
        );

        // Verificando se o ciclo foi concluído
        if (secondsDifferance >= totalSeconds) {
          setCycles(
            cycles.map((cycle) => {
              if (cycle.id === activeCycleId) {
                return {
                  ...cycle,
                  finishDate: new Date(),
                };
              } else {
                return cycle;
              }
            })
          );

          // Resolver bug: Quando o novo calculo de diferença é igual, é preciso atualizar o tanto que passou
          setAmountSecondsPassed(totalSeconds);

          // Resetar o intervalo quando o ciclo for concluido
          clearInterval(interval);
        } else {
          // Comparar a data atual (new Data) com que salvei (startDate) e ver quantos segundos já se passaram
          setAmountSecondsPassed(secondsDifferance);
        }
      }, 1000);
    }

    // Quando eu crio um novo ciclo, useeffect executa denovo
    // Essa função vai servir para deletar on intervalos que não precisamos (Anterior)
    return () => {
      clearInterval(interval);
    };
  }, [activeCycle, activeCycleId]);

  // Criação de novo ciclo
  function handleCreateNewCycle(data: NewCycleFormData) {
    const id = String(new Date().getTime());
    const newCycle: Cycle = {
      id,
      task: data.task,
      minutesAmount: data.minutesAmount,
      startDate: new Date(),
    };

    // Se o estado depende da sua versão anterior, setamos no formato de função
    setCycles((state) => [...state, newCycle]);
    setActiveCycleId(id);

    // Previnir bug: Para não reaproveitar os segundos do ciclo anterior
    setAmountSecondsPassed(0);
    reset();
  }

  // Interromper ciclo
  function handleInterruptCycle() {
    // Anotar dentro do meu ciclo se ele foi interrompido ou não
    setCycles(
      cycles.map((cycle) => {
        if (cycle.id === activeCycleId) {
          return {
            ...cycle,
            interruptedDate: new Date(),
          };
        } else {
          return cycle;
        }
      })
    );

    setActiveCycleId(null);
  }

  useEffect(() => {
    if (activeCycle) {
      document.title = `${minutes}:${seconds}`;
    }
  }, [minutes, seconds, activeCycle]);

  console.log(secondsAmount);

  const task = watch("task");
  const isSubmitDisabled = !task;

  return (
    <HomeContainer>
      <form onSubmit={handleSubmit(handleCreateNewCycle)}>
        <FormContainer>
          <label htmlFor="task">Vou trabalhar em</label>
          <TaskInput
            id="task"
            type="text"
            list="task-suggestions"
            placeholder="Dê um nome para seu projeto"
            disabled={!!activeCycle}
            {...register("task")}
          />

          <datalist id="task-suggestions">
            <option value="Projeto 1"></option>
          </datalist>

          <label htmlFor="minutesAmount">durante</label>
          <MinutesAmountInput
            type="number"
            id="minutesAmount"
            placeholder="00"
            step={5}
            min={1}
            max={60}
            disabled={!!activeCycle}
            {...register("minutesAmount")}
          />

          <span>minutos.</span>
        </FormContainer>

        <CountdownContainer>
          <span>{minutes[0]}</span>
          <span>{minutes[1]}</span>
          <Separator>:</Separator>
          <span>{seconds[0]}</span>
          <span>{seconds[1]}</span>
        </CountdownContainer>

        {activeCycle ? (
          <StopCountdownButton onClick={handleInterruptCycle} type="button">
            <HandPalm /> Interromper
          </StopCountdownButton>
        ) : (
          <StartCountdownButton disabled={isSubmitDisabled} type="submit">
            <Play /> Começar
          </StartCountdownButton>
        )}
      </form>
    </HomeContainer>
  );
}
