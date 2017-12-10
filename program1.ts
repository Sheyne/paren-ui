import { Lisp } from "./language";

export const program: Lisp.Pair = {
    "name": "letrec",
    "args": [
        {
            "name": "inc",
            "args": [
                {
                    "name": "lambda",
                    "args": [
                        {
                            "name": "",
                            "args": [
                                {
                                    "name": "x"
                                }
                            ]
                        },
                        {
                            "name": "+",
                            "args": [
                                {
                                    "name": "x"
                                },
                                {
                                    "name": "1"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "name": "∑",
            "args": [
                {
                    "name": "lambda",
                    "args": [
                        {
                            "name": "",
                            "args": [
                                {
                                    "name": "low"
                                },
                                {
                                    "name": "high"
                                },
                                {
                                    "name": "func"
                                },
                                {
                                    "name": "accum"
                                }
                            ]
                        },
                        {
                            "name": "if",
                            "args": [
                                {
                                    "name": ">",
                                    "args": [
                                        {
                                            "name": "low"
                                        },
                                        {
                                            "name": "high"
                                        }
                                    ]
                                },
                                {
                                    "name": "accum"
                                },
                                {
                                    "name": "∑",
                                    "args": [
                                        {
                                            "name": "inc",
                                            "args": [
                                                {
                                                    "name": "low"
                                                }
                                            ]
                                        },
                                        {
                                            "name": "high"
                                        },
                                        {
                                            "name": "func"
                                        },
                                        {
                                            "name": "+",
                                            "args": [
                                                {
                                                    "name": "accum"
                                                },
                                                {
                                                    "name": "func",
                                                    "args": [
                                                        {
                                                            "name": "low"
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "name": "∑",
            "args": [
                {
                    "name": "1"
                },
                {
                    "name": "3"
                },
                {
                    "name": "lambda",
                    "args": [
                        {
                            "name": "",
                            "args": [
                                {
                                    "name": "x"
                                }
                            ]
                        },
                        {
                            "name": "x"
                        }
                    ]
                },
                {
                    "name": "0"
                }
            ]
        }
    ]
}